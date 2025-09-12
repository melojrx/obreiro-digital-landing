from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from datetime import date

from apps.denominations.models import Denomination
from apps.churches.models import Church
from .models import Member

User = get_user_model()


class RequiredFieldsTest(APITestCase):
    """
    Test suite for required CPF and phone fields.
    """

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="adminpassword",
            full_name="Admin User",
            phone="(11) 99999-9999"
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
            subscription_end_date=date(2099, 1, 1)
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        self.members_url = reverse("member-list")

    def test_create_member_missing_cpf(self):
        """Test API validation for missing CPF"""
        data = {
            "church": self.church.id,
            "full_name": "Test Member",
            "birth_date": "1990-01-01",
            "gender": "M",
            "phone": "(11) 99999-9999"
            # CPF missing
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", response.data)

    def test_create_member_missing_phone(self):
        """Test API validation for missing phone"""
        data = {
            "church": self.church.id,
            "full_name": "Test Member",
            "birth_date": "1990-01-01",
            "gender": "M",
            "cpf": "123.456.789-00"
            # Phone missing
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_create_member_success(self):
        """Test successful member creation with required fields"""
        data = {
            "church": self.church.id,
            "full_name": "Test Member",
            "birth_date": "1990-01-01",
            "gender": "M",
            "cpf": "123.456.789-00",
            "phone": "(11) 99999-9999"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cpf"], "123.456.789-00")
        self.assertEqual(response.data["phone"], "(11) 99999-9999")

    def test_no_null_cpf_in_database(self):
        """Test that no members have null CPF after migration"""
        null_cpf_count = Member.objects.filter(cpf__isnull=True).count()
        self.assertEqual(null_cpf_count, 0)

    def test_no_empty_phone_in_database(self):
        """Test that no members have empty phone after migration"""
        empty_phone_count = Member.objects.filter(phone__isnull=True).count()
        self.assertEqual(empty_phone_count, 0)


class SystemUserCreationTest(APITestCase):
    """
    Test suite for system user creation during member registration.
    """

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@test.com",
            password="adminpassword",
            full_name="Admin User",
            phone="(11) 99999-9999"
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
            subscription_end_date=date(2099, 1, 1)
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        self.members_url = reverse("member-list")

    def test_create_member_with_system_user(self):
        """Test creating member with system user access"""
        data = {
            "church": self.church.id,
            "full_name": "Church Admin",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "987.654.321-00",
            "phone": "(11) 88888-7777",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "churchadmin@test.com",
            "user_password": "securepass123"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check member was created
        member = Member.objects.get(id=response.data["id"])
        self.assertIsNotNone(member.user)
        
        # Check user was created
        user = member.user
        self.assertEqual(user.email, "churchadmin@test.com")
        self.assertEqual(user.full_name, "Church Admin")
        
        # Check ChurchUser was created with correct role
        from apps.accounts.models import ChurchUser
        church_user = ChurchUser.objects.get(user=user, church=self.church)
        self.assertEqual(church_user.role, "church_admin")

    def test_create_member_system_user_missing_fields(self):
        """Test validation when system user fields are missing"""
        data = {
            "church": self.church.id,
            "full_name": "Test Member",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "987.654.321-00",
            "phone": "(11) 88888-7777",
            "create_system_user": True
            # Missing system_role, user_email, user_password
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)