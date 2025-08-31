
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from datetime import date

from apps.denominations.models import Denomination
from apps.churches.models import Church
from .models import Member, MinisterialFunctionLog

User = get_user_model()


class MinisterialFunctionHistoryTest(APITestCase):
    """
    Test suite for changing ministerial function and viewing its history.
    """

    def setUp(self):
        """
        Set up the necessary objects for the tests.
        """
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="adminpassword",
            full_name="Admin User"
        )

        self.denomination = Denomination.objects.create(
            name="Test Denomination",
            short_name="TD",
            administrator=self.admin_user,
            email="denom@test.com",
            phone="(11) 99999-9999",
            headquarters_address="Denomination Street, 123",
            headquarters_city="Denom City",
            headquarters_state="DS",
            headquarters_zipcode="12345-000"
        )

        self.church = Church.objects.create(
            denomination=self.denomination,
            name="Test Church",
            short_name="TC",
            email="church@test.com",
            phone="(11) 88888-8888",
            address="Test Street, 456",
            city="Test City",
            state="TS",
            zipcode="54321-000",
            subscription_end_date=date(2099, 1, 1) # Far future date
        )

        self.member = Member.objects.create(
            church=self.church,
            full_name="Test Member",
            birth_date=date(1990, 1, 1),
            gender="M",
            marital_status="S",
            membership_status="A",
            ministerial_function="member"  # Correct value
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        self.change_function_url = reverse(
            "member-change-ministerial-function",
            kwargs={'pk': self.member.pk}
        )
        self.history_url = reverse(
            "member-ministerial-history",
            kwargs={'pk': self.member.pk}
        )

    def test_change_ministerial_function_success(self):
        """
        Ensure we can successfully change a member's ministerial function.
        """
        self.assertEqual(self.member.ministerial_function, "member") # Correct value
        self.assertEqual(MinisterialFunctionLog.objects.count(), 0)

        payload = {
            "new_function": "deacon",  # Correct value
            "effective_date": date.today(),
            "observations": "Promoted to Deacon"
        }

        response = self.client.patch(self.change_function_url, payload, format='json')

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Função ministerial alterada com sucesso')
        self.assertTrue(response.data['logged'])

        # Check database
        self.member.refresh_from_db()
        self.assertEqual(self.member.ministerial_function, "deacon") # Correct value

        # Check log
        self.assertEqual(MinisterialFunctionLog.objects.count(), 1)
        log_entry = MinisterialFunctionLog.objects.first()
        self.assertEqual(log_entry.member, self.member)
        self.assertEqual(log_entry.old_function, "member") # Correct value
        self.assertEqual(log_entry.new_function, "deacon") # Correct value
        self.assertEqual(log_entry.changed_by, self.admin_user)
        self.assertEqual(log_entry.observations, "Promoted to Deacon")

    def test_change_to_same_function(self):
        """
        Ensure no change or log is made if the function is the same.
        """
        payload = {
            "new_function": "member",  # Correct value
            "effective_date": date.today()
        }

        response = self.client.patch(self.change_function_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Nenhuma alteração necessária - função já é a mesma')
        self.assertFalse(response.data['logged'])

        # Ensure no log was created
        self.assertEqual(MinisterialFunctionLog.objects.count(), 0)

    def test_get_ministerial_history(self):
        """
        Ensure we can retrieve the ministerial history for a member.
        """
        # First change: Membro -> Diácono
        response1 = self.client.patch(self.change_function_url, {
            "new_function": "deacon", "effective_date": date(2024, 1, 1) # Correct value
        }, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Second change: Diácono -> Presbítero
        response2 = self.client.patch(self.change_function_url, {
            "new_function": "elder", "effective_date": date(2025, 1, 1) # Correct value
        }, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        self.assertEqual(MinisterialFunctionLog.objects.count(), 2)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_changes'], 2)
        self.assertEqual(len(response.data['history']), 2)

        # History is ordered by -effective_date
        self.assertEqual(response.data['history'][0]['new_function'], 'elder') # Correct value
        self.assertEqual(response.data['history'][1]['new_function'], 'deacon') # Correct value
        self.assertEqual(response.data['current_function_display'], 'Presbítero')

    def test_change_function_invalid_payload(self):
        """
        Ensure a 400 Bad Request is returned for invalid data.
        """
        payload = {
            "new_function": "INVALID_FUNCTION",
            "effective_date": "not-a-date"
        }

        response = self.client.patch(self.change_function_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_function', response.data)
        self.assertIn('effective_date', response.data)
