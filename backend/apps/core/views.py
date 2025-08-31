"""
Views básicas para o app Core
Endpoints de teste e utilitários
"""

from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
from rest_framework.views import APIView
from apps.churches.models import SubscriptionPlanChoices, Church

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def api_status(request):
    """
    Endpoint para verificar status da API
    """
    return Response({
        'status': 'OK',
        'message': 'ObreiroVirtual API está funcionando!',
        'version': '1.0.0',
        'user': request.user.username if request.user.is_authenticated else 'Anonymous'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Estatísticas gerais do sistema para dashboard
    """
    user = request.user
    
    # Estatísticas básicas
    stats = {
        'total_users': User.objects.count(),
        'user_authenticated': user.is_authenticated,
        'user_is_superuser': user.is_superuser,
        'username': user.username,
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check para monitoramento
    """
    try:
        # Testar conexão com banco
        user_count = User.objects.count()
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'user_count': user_count,
            'timestamp': '2025-06-11T22:50:00Z'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CEPProxyView(APIView):
    """
    Proxy para a API ViaCEP.
    Recebe um CEP e retorna os dados do endereço.
    Evita problemas de CORS no frontend e centraliza a lógica.
    """
    permission_classes = [AllowAny]

    def get(self, request, cep, format=None):
        """
        Busca o CEP na API externa ViaCEP.
        """
        # Limpar e validar o CEP
        cep = ''.join(filter(str.isdigit, cep))
        if len(cep) != 8:
            return Response(
                {"error": "CEP inválido. Deve conter 8 dígitos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            url = f"https://viacep.com.br/ws/{cep}/json/"
            api_response = requests.get(url)
            api_response.raise_for_status()  # Lança exceção para erros HTTP
            
            data = api_response.json()
            
            if data.get("erro"):
                return Response(
                    {"error": "CEP não encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Mapear os campos para o nosso padrão
            formatted_data = {
                "cep": data.get("cep"),
                "logradouro": data.get("logradouro"),
                "complemento": data.get("complemento"),
                "bairro": data.get("bairro"),
                "localidade": data.get("localidade"),
                "uf": data.get("uf"),
                "ibge": data.get("ibge"),
                "gia": data.get("gia"),
                "ddd": data.get("ddd"),
                "siafi": data.get("siafi"),
            }
            
            return Response(formatted_data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            # Logar o erro real no servidor
            print(f"Erro ao contatar a API ViaCEP: {e}")
            return Response(
                {"error": "Serviço de busca de CEP indisponível no momento."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            print(f"Erro inesperado na busca de CEP: {e}")
            return Response(
                {"error": "Ocorreu um erro interno ao buscar o CEP."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubscriptionPlansView(APIView):
    """
    Retorna os planos de assinatura disponíveis no sistema.
    Os dados são montados a partir dos modelos para garantir consistência.
    """
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        # Usar uma instância temporária do modelo para acessar os métodos
        temp_church = Church()
        
        # Mapeamento de preços por plano
        plan_pricing = {
            SubscriptionPlanChoices.BASIC: {
                'price': '0',
                'period': 'gratuito',
                'description': 'Ideal para igrejas pequenas começando a digitalizar sua gestão'
            },
            SubscriptionPlanChoices.PROFESSIONAL: {
                'price': '99',
                'period': 'mês',
                'description': 'Para igrejas em crescimento que precisam de mais recursos'
            },
            SubscriptionPlanChoices.ENTERPRISE: {
                'price': '299',
                'period': 'mês',
                'description': 'Para igrejas grandes com necessidades avançadas'
            },
            SubscriptionPlanChoices.DENOMINATION: {
                'price': 'Consultar',
                'period': '',
                'description': 'Solução completa para denominações e redes de igrejas'
            }
        }
        
        plans = []
        for choice in SubscriptionPlanChoices:
            temp_church.subscription_plan = choice.value
            pricing_info = plan_pricing.get(choice, {})
            
            plans.append({
                'id': choice.value,
                'name': choice.label,
                'features': temp_church.get_plan_features(),
                'price': pricing_info.get('price', 'Consultar'),
                'period': pricing_info.get('period', ''),
                'description': pricing_info.get('description', ''),
                'is_popular': choice == SubscriptionPlanChoices.PROFESSIONAL,
                'is_enterprise': choice == SubscriptionPlanChoices.ENTERPRISE,
            })

        return Response(plans, status=status.HTTP_200_OK)
