"""
Views para a dashboard do Super Admin.
Endpoints de leitura com dados agregados da plataforma.
"""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSuperUser
from django.core.cache import cache
from drf_spectacular.utils import extend_schema

from .serializers import (
    ActivitySummarySerializer,
    ActivityLoginsSerializer,
    GeoStateSerializer,
    NewMembersSerializer,
    PlatformOverviewSerializer,
    PlanDistributionSerializer,
    SubscriptionAlertSerializer,
    TopChurchSerializer,
    TopChurchVisitorsSerializer,
)
from .services import PlatformMetricsService


class PlatformOverviewView(APIView):
    """
    KPIs principais da plataforma.
    GET /api/v1/platform/overview/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=PlatformOverviewSerializer,
        summary="KPIs principais do dashboard do Super Admin",
    )
    def get(self, request):
        data = PlatformMetricsService.get_cached(
            "platform_admin:overview",
            PlatformMetricsService.get_overview,
        )
        serializer = PlatformOverviewSerializer(data)
        return Response(serializer.data)


class PlanDistributionView(APIView):
    """
    Distribuição de igrejas por plano.
    GET /api/v1/platform/distributions/plans/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=PlanDistributionSerializer,
        summary="Distribuição de igrejas por plano",
    )
    def get(self, request):
        data = PlatformMetricsService.get_cached(
            "platform_admin:plan_distribution",
            PlatformMetricsService.get_plan_distribution,
        )
        serializer = PlanDistributionSerializer(data)
        return Response(serializer.data)


class TopChurchesView(APIView):
    """
    Ranking das igrejas com mais membros.
    GET /api/v1/platform/rankings/top-churches/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=TopChurchSerializer(many=True),
        summary="Top igrejas por número de membros",
    )
    def get(self, request):
        churches = PlatformMetricsService.get_top_churches()
        serializer = TopChurchSerializer(churches, many=True)
        return Response(serializer.data)


class ActivitySummaryView(APIView):
    """
    Atividade recente de usuários e membros.
    GET /api/v1/platform/activity/summary/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=ActivitySummarySerializer,
        summary="Resumo de atividade (logins, novos usuários/membros)",
    )
    def get(self, request):
        data = PlatformMetricsService.get_activity_summary()
        serializer = ActivitySummarySerializer(data)
        return Response(serializer.data)


class TopChurchesVisitorsView(APIView):
    """
    Ranking de igrejas por visitantes acumulados.
    GET /api/v1/platform/rankings/top-churches-visitors/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=TopChurchVisitorsSerializer(many=True),
        summary="Top igrejas por visitantes acumulados",
    )
    def get(self, request):
        churches = PlatformMetricsService.get_top_churches_by_visitors()
        serializer = TopChurchVisitorsSerializer(churches, many=True)
        return Response(serializer.data)


class ActivityLoginsView(APIView):
    """
    Atividade de login (24h/7d) em endpoint dedicado.
    GET /api/v1/platform/activity/logins/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=ActivityLoginsSerializer,
        summary="Logins em 24h e 7d",
    )
    def get(self, request):
        data = PlatformMetricsService.get_activity_summary()
        serializer = ActivityLoginsSerializer(
            {"logins_24h": data["logins_24h"], "logins_7d": data["logins_7d"]}
        )
        return Response(serializer.data)


class SubscriptionAlertsView(APIView):
    """
    Igrejas com assinatura expirando ou expirada.
    GET /api/v1/platform/subscriptions/expiring/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=SubscriptionAlertSerializer,
        summary="Assinaturas expiradas ou a expirar",
    )
    def get(self, request):
        data = PlatformMetricsService.get_subscription_alerts()
        serializer = SubscriptionAlertSerializer(data)
        return Response(serializer.data)


class NewMembersThisMonthView(APIView):
    """
    Novos membros no mês atual.
    GET /api/v1/platform/members/new-this-month/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=NewMembersSerializer,
        summary="Quantidade de novos membros no mês atual",
    )
    def get(self, request):
        data = PlatformMetricsService.get_new_members_this_month()
        serializer = NewMembersSerializer(data)
        return Response(serializer.data)


class GeographyMapDataView(APIView):
    """
    Dados simplificados por estado.
    GET /api/v1/platform/geography/map-data/
    """

    permission_classes = [IsSuperUser]

    @extend_schema(
        tags=["Platform Admin"],
        responses=GeoStateSerializer(many=True),
        summary="Dados por estado para mapa (igrejas, usuários, membros ativos)",
    )
    def get(self, request):
        data = PlatformMetricsService.get_cached(
            "platform_admin:geo_map_data",
            PlatformMetricsService.get_geography_map_data,
        )
        serializer = GeoStateSerializer(data, many=True)
        return Response(serializer.data)
