from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from apps.denominations.models import Denomination
from apps.accounts.models import CustomUser


class FinalizeRegistrationTests(APITestCase):
    def test_finalize_registration_creates_denomination_when_other_selected(self):
        payload = {
            "email": "novo@usuario.com",
            "full_name": "Novo Usuário",
            "password": "SenhaForte123!",
            "subscription_plan": "basic",
            "phone": "(11) 98765-4321",
            "birth_date": "1990-01-15",
            "gender": "M",
            "cpf": "52998224725",
            "role": "CHURCH_ADMIN",
            "denomination_id": "outros",
            "denomination_other_name": "Comunidade Teste",
            "user_zipcode": "12345-678",
            "user_address": "Rua Principal",
            "user_city": "São Paulo",
            "user_state": "SP",
            "user_neighborhood": "Centro",
            "user_number": "100",
            "user_complement": "Sala 1"
        }

        url = reverse("finalize-registration")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Denomination.objects.count(), 1)

        denomination = Denomination.objects.first()
        self.assertIsNotNone(denomination)
        self.assertEqual(denomination.name, payload["denomination_other_name"])
        self.assertEqual(denomination.administrator.email, payload["email"])

        created_user = CustomUser.objects.get(email=payload["email"])
        self.assertIsNotNone(created_user.profile.intended_denomination)
        self.assertEqual(
            created_user.profile.intended_denomination_id,
            denomination.id
        )
