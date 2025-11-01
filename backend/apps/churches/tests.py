from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from apps.accounts.models import CustomUser, ChurchUser
from apps.core.models import RoleChoices
from apps.denominations.models import Denomination
from apps.churches.models import Church


class AssignAdminSecurityTests(APITestCase):
    """Casos de teste para garantir que usuários não possam escalar seus próprios privilégios."""

    def setUp(self):
        self.client = APIClient()

        # Usuário administrador da denominação/igreja
        self.church_admin = CustomUser.objects.create_user(
            email='marcia@example.com',
            password='StrongPass123',
            full_name='Marcia Admin'
        )

        # Denominação mínima para criar igreja
        self.denomination = Denomination.objects.create(
            name='Denominação Teste',
            short_name='DT',
            administrator=self.church_admin,
            email='contato@denominacao.com',
            phone='(11) 99999-9999',
            headquarters_address='Rua da Fé, 123',
            headquarters_city='São Paulo',
            headquarters_state='SP',
            headquarters_zipcode='01001-000',
        )

        # Igreja vinculada
        self.church = Church.objects.create(
            denomination=self.denomination,
            name='Igreja Central',
            short_name='ICentral',
            email='contato@igrejacentral.com',
            phone='(11) 98888-7777',
            address='Rua Principal, 456',
            city='São Paulo',
            state='SP',
            zipcode='01002-000',
            subscription_end_date=timezone.now() + timedelta(days=30),
        )

        # Vincular Marcia como Church Admin
        ChurchUser.objects.create(
            user=self.church_admin,
            church=self.church,
            role=RoleChoices.CHURCH_ADMIN,
            is_active=True,
            is_user_active_church=True,
        )

        # Usuário secretário
        self.secretary = CustomUser.objects.create_user(
            email='maria@example.com',
            password='AnotherStrongPass123',
            full_name='Maria Secretaria'
        )

        ChurchUser.objects.create(
            user=self.secretary,
            church=self.church,
            role=RoleChoices.SECRETARY,
            is_active=True,
            is_user_active_church=True,
        )

        self.assign_url = reverse('church-assign-admin', kwargs={'pk': self.church.id})

    def test_secretary_cannot_promote_self_to_admin(self):
        """Secretária não pode alterar sua própria permissão para admin."""
        self.client.force_authenticate(user=self.secretary)

        response = self.client.post(
            self.assign_url,
            {'user_id': self.secretary.id, 'role': RoleChoices.CHURCH_ADMIN},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        church_user = ChurchUser.objects.get(user=self.secretary, church=self.church)
        self.assertEqual(church_user.role, RoleChoices.SECRETARY)

    def test_church_admin_can_assign_admin_to_other_user(self):
        """Church Admin permanece capaz de promover outro usuário ao mesmo nível."""
        self.client.force_authenticate(user=self.church_admin)

        response = self.client.post(
            self.assign_url,
            {'user_id': self.secretary.id, 'role': RoleChoices.CHURCH_ADMIN},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        church_user = ChurchUser.objects.get(user=self.secretary, church=self.church)
        self.assertEqual(church_user.role, RoleChoices.CHURCH_ADMIN)
