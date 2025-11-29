from datetime import date, timedelta

from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from apps.accounts.models import CustomUser
from apps.churches.models import Church
from apps.core.models import SubscriptionPlanChoices
from apps.denominations.models import Denomination
from apps.members.models import Member
from apps.visitors.models import Visitor


class PlatformAdminEndpointsTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        now = timezone.now()
        cache.clear()

        self.superuser = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="StrongPass123",
            full_name="Admin User",
        )
        self.superuser.last_login = now
        self.superuser.save(update_fields=["last_login"])

        self.regular_user = CustomUser.objects.create_user(
            email="user@example.com",
            password="UserPass123",
            full_name="Regular User",
        )
        self.regular_user.last_login = now
        self.regular_user.save(update_fields=["last_login"])

        self.denomination = Denomination.objects.create(
            name="Denominação Teste",
            short_name="DT",
            administrator=self.superuser,
            email="denom@example.com",
            phone="(11) 99999-9999",
            headquarters_address="Rua 1",
            headquarters_city="São Paulo",
            headquarters_state="SP",
            headquarters_zipcode="01001-000",
            subscription_end_date=now + timedelta(days=60),
        )

        self.church_expiring = Church.objects.create(
            denomination=self.denomination,
            name="Igreja Expirando",
            short_name="Expira",
            email="expira@example.com",
            phone="(11) 98888-7777",
            address="Rua A, 123",
            city="São Paulo",
            state="SP",
            zipcode="01002-000",
            subscription_end_date=now + timedelta(days=5),
            subscription_plan=SubscriptionPlanChoices.PROFESSIONAL,
        )

        self.church_expired = Church.objects.create(
            denomination=self.denomination,
            name="Igreja Expirada",
            short_name="Expirada",
            email="expirada@example.com",
            phone="(11) 97777-6666",
            address="Rua B, 456",
            city="Rio de Janeiro",
            state="RJ",
            zipcode="20000-000",
            subscription_end_date=now - timedelta(days=2),
            subscription_plan=SubscriptionPlanChoices.BASIC,
        )

        Member.objects.create(
            church=self.church_expiring,
            full_name="Membro 1",
            birth_date=date(1990, 1, 1),
            phone="(11) 90000-0001",
            address="Rua 1",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            zipcode="01001-000",
        )
        Member.objects.create(
            church=self.church_expiring,
            full_name="Membro 2",
            birth_date=date(1992, 2, 2),
            phone="(11) 90000-0002",
            address="Rua 2",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            zipcode="01001-000",
        )
        Member.objects.create(
            church=self.church_expired,
            full_name="Membro 3",
            birth_date=date(1995, 3, 3),
            phone="(21) 90000-0003",
            address="Rua 3",
            neighborhood="Centro",
            city="Rio de Janeiro",
            state="RJ",
            zipcode="20000-000",
        )

        Visitor.objects.create(
            church=self.church_expiring,
            full_name="Visitante 1",
            email="visit@example.com",
            phone="(11) 95555-5555",
            city="São Paulo",
            state="SP",
        )

    def test_overview_requires_superuser(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(reverse("platform-overview"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_overview_returns_counts(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(reverse("platform-overview"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["users"]["total"], 2)
        self.assertEqual(data["users"]["active_30d"], 2)
        self.assertEqual(data["churches"]["total"], 2)
        self.assertEqual(data["members"]["total"], 3)
        self.assertEqual(data["plans"]["total"], 2)
        self.assertEqual(data["subscriptions"]["expiring_count"], 1)
        self.assertEqual(data["subscriptions"]["expired_count"], 1)
        self.assertEqual(data["activity"]["logins_24h"], 2)

    def test_top_churches_and_distribution(self):
        self.client.force_authenticate(user=self.superuser)

        top_response = self.client.get(reverse("platform-top-churches"))
        self.assertEqual(top_response.status_code, status.HTTP_200_OK)
        top_data = top_response.json()
        self.assertEqual(len(top_data), 2)
        self.assertEqual(top_data[0]["name"], "Igreja Expirando")
        self.assertEqual(top_data[0]["members_count"], 2)

        plan_response = self.client.get(reverse("platform-plan-distribution"))
        self.assertEqual(plan_response.status_code, status.HTTP_200_OK)
        plans = plan_response.json()["plans"]
        plan_keys = {item["plan"] for item in plans}
        self.assertSetEqual(
            plan_keys,
            {SubscriptionPlanChoices.PROFESSIONAL, SubscriptionPlanChoices.BASIC},
        )

        visitors_response = self.client.get(reverse("platform-top-churches-visitors"))
        self.assertEqual(visitors_response.status_code, status.HTTP_200_OK)
        visitors = visitors_response.json()
        self.assertEqual(visitors[0]["name"], "Igreja Expirando")
        self.assertEqual(visitors[0]["visitors_count"], 1)

    def test_cache_hit_on_overview(self):
        self.client.force_authenticate(user=self.superuser)
        cache_key = "platform_admin:overview"
        cache.delete(cache_key)

        self.client.get(reverse("platform-overview"))
        cached_first = cache.get(cache_key)
        self.assertIsNotNone(cached_first)

        CustomUser.objects.create_user(
            email="new@example.com",
            password="pass123",
            full_name="Novo User",
        )
        response = self.client.get(reverse("platform-overview"))
        data = response.json()
        self.assertEqual(data["users"]["total"], cached_first["users"]["total"])

    def test_new_members_and_logins_endpoints(self):
        self.client.force_authenticate(user=self.superuser)

        logins_resp = self.client.get(reverse("platform-activity-logins"))
        self.assertEqual(logins_resp.status_code, status.HTTP_200_OK)
        logins = logins_resp.json()
        self.assertIn("logins_24h", logins)
        self.assertIn("logins_7d", logins)

        new_members_resp = self.client.get(reverse("platform-new-members-month"))
        self.assertEqual(new_members_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(new_members_resp.json()["new_members_month"], 3)

    def test_geo_map_endpoint(self):
        self.client.force_authenticate(user=self.superuser)
        resp = self.client.get(reverse("platform-geo-map-data"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("code", data[0])
