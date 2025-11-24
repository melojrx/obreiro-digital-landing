from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from datetime import date
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.denominations.models import Denomination
from apps.churches.models import Church
from apps.branches.models import Branch
from .models import Member, FamilyRelationship
from apps.accounts.models import ChurchUser, RoleChoices, UserProfile

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

    def test_duplicate_cpf_same_denomination_allowed(self):
        """Mesmo CPF na mesma denominação deve ser permitido para membros."""
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
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)

    def test_duplicate_cpf_different_denomination_ok(self):
        """Mesmo CPF em denominações diferentes continua permitido"""
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
        self.assertEqual(user.profile.cpf, member.cpf)
        
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

    def test_create_member_system_user_email_must_be_unique_globally(self):
        """Não permitir criar usuário do sistema com e-mail já existente em outra igreja."""
        # Usuário pré-existente com email duplicado
        User.objects.create_user(
            email="dup@test.com",
            password="123456",
            full_name="Other User",
            phone="(11) 96666-6666"
        )

        data = {
            "church": self.church.id,
            "full_name": "Member With Dup Email",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "390.533.447-05",
            "phone": "(11) 80000-0000",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "dup@test.com",
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user_email", response.data)
        self.assertTrue("E-mail" in str(response.data["user_email"]))

    def test_create_member_system_user_cpf_must_be_unique_between_users(self):
        """CPF duplicado entre usuários do sistema deve bloquear criação do usuário."""
        existing_user = User.objects.create_user(
            email="cpfuser@test.com",
            password="123456",
            full_name="Existing CPF",
            phone="(11) 97777-7777"
        )
        UserProfile.objects.create(user=existing_user, cpf="390.533.447-05")

        data = {
            "church": self.church.id,
            "full_name": "New Member",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "390.533.447-05",
            "phone": "(11) 80000-0001",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "newuser@test.com",
        }
        response = self.client.post(self.members_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", response.data)
        self.assertTrue("CPF" in str(response.data["cpf"]))

    def test_update_member_system_user_role_change(self):
        """Permite ajustar o papel de acesso para membro que já tem usuário."""
        create_resp = self.client.post(self.members_url, {
            "church": self.church.id,
            "full_name": "Role Change Member",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "390.533.447-05",
            "phone": "(11) 80000-1000",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "rolechange@test.com",
        })
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        member = Member.objects.get(cpf="390.533.447-05")
        church_user = ChurchUser.objects.get(user=member.user, church=self.church)
        self.assertEqual(church_user.role, RoleChoices.CHURCH_ADMIN)

        detail_url = reverse("member-detail", args=[member.id])
        patch_resp = self.client.patch(detail_url, {
            "system_role": RoleChoices.SECRETARY,
        })
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        church_user.refresh_from_db()
        self.assertEqual(church_user.role, RoleChoices.SECRETARY)

    def test_update_member_system_user_revoke_access(self):
        """Permite remover acesso ao sistema de membro existente."""
        create_resp = self.client.post(self.members_url, {
            "church": self.church.id,
            "full_name": "Revoke Member",
            "birth_date": "1985-01-01",
            "gender": "M",
            "cpf": "529.982.247-25",
            "phone": "(11) 80000-2000",
            "create_system_user": True,
            "system_role": "church_admin",
            "user_email": "revokemember@test.com",
        })
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        member = Member.objects.get(cpf="529.982.247-25")
        user = member.user
        self.assertIsNotNone(user)
        detail_url = reverse("member-detail", args=[member.id])

        patch_resp = self.client.patch(detail_url, {
            "revoke_system_access": True,
        })
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        member.refresh_from_db()
        self.assertIsNone(member.user)
        self.assertFalse(ChurchUser.objects.filter(user=user, church=self.church, is_active=True).exists())


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


class FamilyRelationshipTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="family-admin@test.com",
            password="adminpassword",
            full_name="Family Admin",
            phone="(11) 95555-1111"
        )

        self.denomination = Denomination.objects.create(
            name="Fam Denomination",
            short_name="FD",
            administrator=self.admin_user,
            email="famdenom@test.com",
            phone="(11) 95555-2222",
            headquarters_address="Rua Central, 10",
            headquarters_city="Cidade F",
            headquarters_state="SP",
            headquarters_zipcode="01010-100"
        )

        self.church = Church.objects.create(
            denomination=self.denomination,
            name="Fam Church",
            short_name="FC",
            email="famchurch@test.com",
            phone="(11) 95555-3333",
            address="Rua da Igreja, 20",
            city="Cidade F",
            state="SP",
            zipcode="02020-200",
            subscription_end_date=date(2099, 1, 1)
        )

        self.branch, _ = Branch.objects.get_or_create(
            church=self.church,
            name="Fam Church - Matriz",
            defaults={
                'short_name': "Matriz F",
                'description': "Filial principal",
                'email': "fambranch@test.com",
                'phone': "(11) 94444-4444",
                'address': "Rua Principal, 30",
                'neighborhood': "Centro",
                'city': "Cidade F",
                'state': "SP",
                'zipcode': "03030-300",
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

    def test_create_member_with_children_links_existing(self):
        child = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Child Member",
            birth_date=date(2010, 1, 1),
            gender="M",
            phone="(11) 93333-3333"
        )

        resp = self.client.post(self.members_url, {
            "church": self.church.id,
            "full_name": "Parent Member",
            "birth_date": "1980-01-01",
            "gender": "M",
            "phone": "(11) 92222-2222",
            "children": [child.id],
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        parent = Member.objects.get(full_name="Parent Member")
        # Verificar vínculos bidirecionais
        self.assertTrue(FamilyRelationship.objects.filter(
            member=parent, related_member=child, relation_type=FamilyRelationship.RELATION_CHILD
        ).exists())
        self.assertTrue(FamilyRelationship.objects.filter(
            member=child, related_member=parent, relation_type=FamilyRelationship.RELATION_PARENT
        ).exists())

    def test_update_member_children_links(self):
        parent = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Parent Update",
            birth_date=date(1980, 2, 2),
            gender="F",
            phone="(11) 94444-4444"
        )
        child1 = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Child One",
            birth_date=date(2011, 1, 1),
            gender="M",
            phone="(11) 95555-5555"
        )
        child2 = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Child Two",
            birth_date=date(2012, 2, 2),
            gender="F",
            phone="(11) 96666-6666"
        )

        detail_url = reverse("member-detail", args=[parent.id])
        resp1 = self.client.patch(detail_url, {"children": [child1.id]})
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertTrue(FamilyRelationship.objects.filter(
            member=parent, related_member=child1, relation_type=FamilyRelationship.RELATION_CHILD
        ).exists())

        resp2 = self.client.patch(detail_url, {"children": [child2.id]})
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertFalse(FamilyRelationship.objects.filter(
            member=parent, related_member=child1, relation_type=FamilyRelationship.RELATION_CHILD
        ).exists())
        self.assertTrue(FamilyRelationship.objects.filter(
            member=parent, related_member=child2, relation_type=FamilyRelationship.RELATION_CHILD
        ).exists())


class SpouseSynchronizationTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="sync-admin@test.com",
            password="adminpassword",
            full_name="Sync Admin",
            phone="(11) 93333-9999",
        )

        self.denomination = Denomination.objects.create(
            name="Sync Denomination",
            short_name="SD",
            administrator=self.admin_user,
            email="sync@denom.com",
            phone="(11) 93333-1111",
            headquarters_address="Rua Denom, 1",
            headquarters_city="São Paulo",
            headquarters_state="SP",
            headquarters_zipcode="01010-000",
        )

        self.church = Church.objects.create(
            denomination=self.denomination,
            name="Igreja Sincronizada",
            short_name="IS",
            email="igreja@sync.com",
            phone="(11) 94444-0000",
            address="Rua Principal, 10",
            city="São Paulo",
            state="SP",
            zipcode="01011-000",
            subscription_end_date=date(2099, 1, 1),
        )

        self.branch = self.church.branches.first()
        if not self.branch:
            self.branch = Branch.objects.create(
                church=self.church,
                name="Igreja Sincronizada - Matriz",
                short_name="Matriz",
                email="matriz@sync.com",
                phone="(11) 95555-0000",
                address="Rua Principal, 10",
                neighborhood="Centro",
                city="São Paulo",
                state="SP",
                zipcode="01011-000",
                qr_code_active=True,
                is_main=True,
            )

        self.member_a = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="João Almeida",
            birth_date=date(1990, 1, 1),
            gender="M",
            marital_status="single",
            email="joao.almeida@test.com",
            phone="(11) 96666-0000",
            membership_date=date(2010, 1, 1),
        )

        self.member_b = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Maria Oliveira",
            birth_date=date(1992, 6, 10),
            gender="F",
            marital_status="single",
            email="maria.oliveira@test.com",
            phone="(11) 97777-0000",
            membership_date=date(2012, 5, 15),
        )

    def _marry_members(self):
        self.member_a.marital_status = "married"
        self.member_a.spouse = self.member_b
        self.member_a.save()
        self.member_a.refresh_from_db()
        self.member_b.refresh_from_db()

    def test_marriage_updates_both_members(self):
        self._marry_members()

        self.assertEqual(self.member_b.marital_status, "married")
        self.assertEqual(self.member_b.spouse_id, self.member_a.id)
        self.assertEqual(self.member_a.spouse_id, self.member_b.id)

    def test_removing_spouse_clears_partner(self):
        self._marry_members()

        self.member_a.marital_status = "single"
        self.member_a.spouse = None
        self.member_a.save()
        self.member_b.refresh_from_db()

        self.assertEqual(self.member_b.marital_status, "single")
        self.assertIsNone(self.member_b.spouse_id)

    def test_deceased_updates_partner_to_widowed(self):
        self._marry_members()

        self.member_a.membership_status = "deceased"
        self.member_a.save()
        self.member_b.refresh_from_db()

        self.assertEqual(self.member_b.marital_status, "widowed")
        self.assertIsNone(self.member_b.spouse_id)


class MemberBulkUploadTests(APITestCase):
    """Testes para a ação de upload em lote de membros."""

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="bulk-admin@test.com",
            password="adminpassword",
            full_name="Bulk Admin",
            phone="(11) 99999-9999",
        )

        self.denomination = Denomination.objects.create(
            name="Bulk Denomination",
            short_name="BD",
            administrator=self.admin_user,
            email="bulk@test.com",
            phone="(11) 98888-8888",
            headquarters_address="Rua 1",
            headquarters_city="Cidade",
            headquarters_state="SP",
            headquarters_zipcode="01010-010",
        )

        self.church = Church.objects.create(
            denomination=self.denomination,
            name="Bulk Church",
            short_name="BC",
            email="church@test.com",
            phone="(11) 97777-7777",
            address="Rua 2",
            city="Cidade",
            state="SP",
            zipcode="02020-020",
            subscription_end_date=date(2099, 1, 1),
        )

        self.branch = Branch.objects.create(
            church=self.church,
            name="Bulk Matriz",
            short_name="Matriz",
            description="Filial principal",
            email="branch@test.com",
            phone="(11) 96666-6666",
            address="Rua 3",
            neighborhood="Centro",
            city="Cidade",
            state="SP",
            zipcode="03030-030",
            qr_code_active=True,
            is_main=True,
        )

        ChurchUser.objects.create(
            user=self.admin_user,
            church=self.church,
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True,
            is_user_active_church=True,
            active_branch=self.branch,
            can_manage_members=True,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        self.bulk_url = reverse("member-bulk-upload")

    def _upload(self, csv_content: str, **extra):
        file = SimpleUploadedFile(
            "membros.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        data = {"file": file}
        data.update(extra)
        return self.client.post(self.bulk_url, data, format="multipart")

    def test_bulk_upload_success(self):
        csv_content = (
            "Nome Completo;CPF;Data Nascimento;Telefone;Email;Genero;Estado Civil;Funcao Ministerial\n"
            "Fulano da Silva;390.533.447-05;10/01/1990;(11) 91234-5678;fulano@test.com;M;Solteiro(a);Membro\n"
        )
        response = self._upload(csv_content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success_count"], 1)
        self.assertEqual(response.data["error_count"], 0)
        self.assertEqual(Member.objects.filter(church=self.church).count(), 1)

    def test_bulk_upload_duplicate_allowed(self):
        Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name="Fulano da Silva",
            cpf="390.533.447-05",
            birth_date=date(1990, 1, 10),
            phone="(11) 91234-5678",
        )

        csv_content = (
            "Nome Completo;CPF;Data Nascimento;Telefone;Email;Genero;Estado Civil;Funcao Ministerial\n"
            "Fulano da Silva;390.533.447-05;10/01/1990;(11) 91234-5678;fulano@test.com;M;Solteiro(a);Membro\n"
        )
        response = self._upload(csv_content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success_count"], 1)
        self.assertEqual(response.data["duplicates_skipped"], 0)

    def test_bulk_upload_invalid_phone_reports_error(self):
        csv_content = (
            "Nome Completo;CPF;Data Nascimento;Telefone;Email;Genero;Estado Civil;Funcao Ministerial\n"
            "Fulano da Silva;390.533.447-05;10/01/1990;123;fulano@test.com;M;Solteiro(a);Membro\n"
        )
        response = self._upload(csv_content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success_count"], 0)
        self.assertEqual(response.data["error_count"], 1)
        self.assertTrue(response.data["errors"][0]["messages"])
