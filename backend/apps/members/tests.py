from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from datetime import date
from django.core.exceptions import ValidationError

from apps.denominations.models import Denomination
from apps.churches.models import Church
from apps.branches.models import Branch
from .models import Member
from apps.accounts.models import ChurchUser, RoleChoices

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

        # Criar filial matriz e marcar como ativa para o usuário
        self.branch, _ = Branch.objects.get_or_create(
            church=self.church,
            name="Test Church - Matriz",
            defaults={
                'short_name': "Matriz",
                'description': "Filial principal",
                'email': "branch@test.com",
                'phone': "(11) 87777-7777",
                'address': "Main Ave, 100",
                'neighborhood': "Centro",
                'city': "Test City",
                'state': "TS",
                'zipcode': "54321-000",
                'qr_code_active': True,
                'is_main': True,
            }
        )

        # Vincular usuário à igreja e definir igreja/filial ativas
        ChurchUser.objects.get_or_create(
            user=self.admin_user,
            church=self.church,
            defaults={
                'role': RoleChoices.CHURCH_ADMIN,
                'is_active': True,
                'is_user_active_church': True,
                'active_branch': self.branch,
                'can_manage_members': True,
            }
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        self.members_url = reverse("member-list")

    def test_create_member_missing_cpf(self):
        """CPF opcional: criação deve ser permitida sem CPF"""
        data = {
            "church": self.church.id,
            "full_name": "Test Member",
            "birth_date": "1990-01-01",
            "gender": "M",
            "phone": "(11) 99999-9999"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

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
            "cpf": "529.982.247-25",
            "phone": "(11) 99999-9999"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cpf"], "529.982.247-25")
        self.assertEqual(response.data["phone"], "(11) 99999-9999")

    def test_cpf_can_be_null(self):
        """CPF pode ser nulo (opcional)"""
        data = {
            "church": self.church.id,
            "full_name": "Member Without CPF",
            "birth_date": "1992-05-05",
            "gender": "M",
            "phone": "(11) 95555-5555"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        member = Member.objects.get(full_name="Member Without CPF")
        self.assertIsNone(member.cpf)

    def test_duplicate_cpf_same_denomination_fails(self):
        """Mesmo CPF na mesma denominação deve falhar, mesmo em igrejas diferentes"""
        cpf_value = "390.533.447-05"
        # Primeiro membro na igreja A
        resp1 = self.client.post(self.members_url, {
            "church": self.church.id,
            "full_name": "Member A",
            "birth_date": "1990-01-01",
            "gender": "M",
            "cpf": cpf_value,
            "phone": "(11) 90000-0000"
        })
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Criar igreja B na MESMA denominação
        church_b = Church.objects.create(
            denomination=self.denomination,
            name="Another Church",
            short_name="AC",
            email="ac@test.com",
            phone="(11) 93333-3333",
            address="Street, 123",
            city="City",
            state="TS",
            zipcode="54321-100",
            subscription_end_date=date(2099, 1, 1)
        )

        # Tentar criar membro com MESMO CPF na igreja B
        resp2 = self.client.post(self.members_url, {
            "church": church_b.id,
            "full_name": "Member B",
            "birth_date": "1991-02-02",
            "gender": "F",
            "cpf": cpf_value,
            "phone": "(11) 91111-1111"
        })
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        # Mensagem pode variar; checar substring
        self.assertTrue(any("CPF" in str(v) for v in resp2.data.values()))

    def test_duplicate_cpf_different_denomination_ok(self):
        """Mesmo CPF em denominações diferentes deve ser permitido"""
        cpf_value = "390.533.447-05"
        # Membro na denom A
        resp1 = self.client.post(self.members_url, {
            "church": self.church.id,
            "full_name": "Member A2",
            "birth_date": "1990-01-01",
            "gender": "M",
            "cpf": cpf_value,
            "phone": "(11) 90000-0001"
        })
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Criar nova denominação e igreja
        denom2 = Denomination.objects.create(
            name="Another Denomination",
            short_name="AD2",
            administrator=self.admin_user,
            email="denom2@test.com",
            phone="(11) 97777-7777",
            headquarters_address="HQ Ave, 1",
            headquarters_city="DenomCity2",
            headquarters_state="DS",
            headquarters_zipcode="12345-100"
        )
        church2 = Church.objects.create(
            denomination=denom2,
            name="Church Denom 2",
            short_name="CD2",
            email="cd2@test.com",
            phone="(11) 92222-0000",
            address="X Street",
            city="City2",
            state="TS",
            zipcode="54321-200",
            subscription_end_date=date(2099, 1, 1)
        )
        # Tornar church2 a igreja ativa do usuário para criação
        Branch.objects.get_or_create(
            church=church2,
            name=f"{church2.name} - Matriz",
            defaults={
                'short_name': 'Matriz',
                'email': 'branch2@test.com',
                'phone': '(11) 93333-0000',
                'address': 'Street 2',
                'neighborhood': 'Centro',
                'city': church2.city,
                'state': church2.state,
                'zipcode': church2.zipcode,
                'qr_code_active': True,
                'is_main': True,
            }
        )
        # Desmarcar ativa anterior e marcar nova ativa
        ChurchUser.objects.filter(user=self.admin_user, church=self.church).update(is_user_active_church=False)
        ChurchUser.objects.get_or_create(
            user=self.admin_user,
            church=church2,
            defaults={
                'role': RoleChoices.CHURCH_ADMIN,
                'is_active': True,
                'is_user_active_church': True,
            }
        )
        # Membro com mesmo CPF na denom B
        resp2 = self.client.post(self.members_url, {
            "church": church2.id,
            "full_name": "Member C",
            "birth_date": "1992-03-03",
            "gender": "F",
            "cpf": cpf_value,
            "phone": "(11) 92222-2222"
        })
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)

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

        # Criar filial matriz e marcar como ativa para o usuário
        self.branch, _ = Branch.objects.get_or_create(
            church=self.church,
            name="Test Church - Matriz",
            defaults={
                'short_name': "Matriz",
                'description': "Filial principal",
                'email': "branch@test.com",
                'phone': "(11) 87777-7777",
                'address': "Main Ave, 100",
                'neighborhood': "Centro",
                'city': "Test City",
                'state': "TS",
                'zipcode': "54321-000",
                'qr_code_active': True,
                'is_main': True,
            }
        )

        ChurchUser.objects.get_or_create(
            user=self.admin_user,
            church=self.church,
            defaults={
                'role': RoleChoices.CHURCH_ADMIN,
                'is_active': True,
                'is_user_active_church': True,
                'active_branch': self.branch,
                'can_manage_members': True,
            }
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
            "cpf": "390.533.447-05",
            "phone": "(11) 88888-7777",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "churchadmin@test.com",
            "user_password": "securepass123"
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Buscar membro pelo CPF (o serializer de criação não retorna id)
        member = Member.objects.get(cpf="390.533.447-05")
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
            "cpf": "845.362.650-04",
            "phone": "(11) 88888-7777",
            "create_system_user": True
            # Missing system_role, user_email, user_password
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MemberBranchRelationshipTest(TestCase):
    """Validates that members respect church ↔ filial constraints."""

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="root@test.com",
            password="adminpassword",
            full_name="Root User",
            phone="(11) 90000-0000"
        )

        self.denomination = Denomination.objects.create(
            name="Denom Principal",
            short_name="DP",
            administrator=self.admin_user,
            email="denom@teste.com",
            phone="(11) 95555-5555",
            headquarters_address="Rua Central, 100",
            headquarters_city="Cidade A",
            headquarters_state="SP",
            headquarters_zipcode="01000-000"
        )

        self.church = Church.objects.create(
            denomination=self.denomination,
            name="Igreja A",
            short_name="IA",
            email="igrejaA@teste.com",
            phone="(11) 94444-4444",
            address="Rua da Igreja, 200",
            city="Cidade A",
            state="SP",
            zipcode="02000-000",
            subscription_end_date=date(2099, 1, 1)
        )

        self.branch, _ = Branch.objects.get_or_create(
            church=self.church,
            name="Igreja A - Matriz",
            defaults={
                'short_name': "Matriz A",
                'description': "Filial principal",
                'email': "matriz@teste.com",
                'phone': "(11) 93333-3333",
                'address': "Rua Principal, 300",
                'neighborhood': "Centro",
                'city': "Cidade A",
                'state': "SP",
                'zipcode': "03000-000",
                'qr_code_active': True,
                'is_main': True,
            }
        )

        self.other_church = Church.objects.create(
            denomination=self.denomination,
            name="Igreja B",
            short_name="IB",
            email="igreb@teste.com",
            phone="(11) 92222-2222",
            address="Rua Secundária, 400",
            city="Cidade B",
            state="RJ",
            zipcode="04000-000",
            subscription_end_date=date(2099, 1, 1)
        )

        self.other_branch, _ = Branch.objects.get_or_create(
            church=self.other_church,
            name="Igreja B - Matriz",
            defaults={
                'short_name': "Matriz B",
                'description': "Outra filial",
                'email': "matrizb@teste.com",
                'phone': "(21) 91111-1111",
                'address': "Rua Central, 500",
                'neighborhood': "Centro",
                'city': "Cidade B",
                'state': "RJ",
                'zipcode': "05000-000",
                'qr_code_active': True,
                'is_main': True,
            }
        )

    def test_member_requires_branch_from_same_church(self):
        with self.assertRaises(ValidationError):
            Member.objects.create(
                church=self.church,
                branch=self.other_branch,
                full_name="Membro Inválido",
                cpf="52998224725",
                birth_date=date(1990, 1, 1),
                phone="(11) 98888-8888"
            )

    def test_member_accepts_branch_from_same_church(self):
        member = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Membro Válido",
            cpf="39053344705",
            birth_date=date(1988, 5, 20),
            phone="(11) 91111-2222"
        )
        self.assertEqual(member.branch, self.branch)
