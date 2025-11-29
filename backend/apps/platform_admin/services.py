"""
Serviços de métricas para o dashboard do Super Admin.
Responsável por agregar dados da plataforma sem depender de modelos extras.
"""

from datetime import timedelta
from typing import List, Dict, Any, Optional

from django.db.models import Count, Q
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.branches.models import Branch
from apps.churches.models import Church
from apps.core.models import SubscriptionPlanChoices
from apps.denominations.models import Denomination
from apps.members.models import Member
from apps.visitors.models import Visitor
from django.core.cache import cache


class PlatformMetricsService:
    """Serviço centralizado para cálculos da dashboard do super admin."""

    @staticmethod
    def _period_bounds():
        """Retorna datas úteis para filtros temporais."""
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_30_days = now - timedelta(days=30)
        return now, start_of_month, last_30_days

    @staticmethod
    def get_overview() -> Dict[str, Any]:
        """KPIs principais para cards de visão geral."""
        now, start_of_month, last_30_days = PlatformMetricsService._period_bounds()

        users_qs = CustomUser.objects.filter(is_active=True)
        users_total = users_qs.count()
        users_active_30d = users_qs.filter(
            last_login__gte=last_30_days
        ).count()
        users_new_month = users_qs.filter(
            date_joined__gte=start_of_month
        ).count()

        denominations_total = Denomination.objects.filter(is_active=True).count()
        churches_total = Church.objects.filter(is_active=True).count()
        churches_new_month = Church.objects.filter(
            is_active=True,
            created_at__gte=start_of_month
        ).count()

        branches_total = Branch.objects.filter(is_active=True).count()

        members_total = Member.objects.filter(is_active=True).count()
        members_new_month = Member.objects.filter(
            is_active=True,
            created_at__gte=start_of_month
        ).count()

        visitors_total = Visitor.objects.filter(is_active=True).count()
        visitors_new_month = Visitor.objects.filter(
            is_active=True,
            created_at__gte=start_of_month
        ).count()

        plan_distribution = PlatformMetricsService.get_plan_distribution(
            total_churches=churches_total
        )
        subscription_alerts = PlatformMetricsService.get_subscription_alerts(
            now=now
        )
        activity = PlatformMetricsService.get_activity_summary(
            now=now,
            start_of_month=start_of_month
        )
        data_quality = PlatformMetricsService.get_data_quality_metrics(
            total_members=members_total,
            total_churches=churches_total,
        )

        return {
            "users": {
                "total": users_total,
                "active_30d": users_active_30d,
                "new_this_month": users_new_month,
            },
            "denominations": {"total": denominations_total},
            "churches": {
                "total": churches_total,
                "new_this_month": churches_new_month,
            },
            "branches": {"total": branches_total},
            "members": {
                "total": members_total,
                "new_this_month": members_new_month,
            },
            "visitors": {
                "total": visitors_total,
                "new_this_month": visitors_new_month,
            },
            "plans": plan_distribution,
            "subscriptions": subscription_alerts,
            "activity": activity,
            "data_quality": data_quality,
        }

    @staticmethod
    def get_plan_distribution(total_churches: Optional[int] = None) -> Dict[str, Any]:
        """Distribuição de igrejas por plano com percentual."""
        if total_churches is None:
            total_churches = Church.objects.filter(is_active=True).count()

        plan_counts = (
            Church.objects.filter(is_active=True)
            .values("subscription_plan")
            .annotate(count=Count("id"))
            .order_by("-count", "subscription_plan")
        )

        labels = dict(SubscriptionPlanChoices.choices)
        plans = []
        for item in plan_counts:
            plan_key = item["subscription_plan"] or "unknown"
            count = item["count"]
            percentage = 0
            if total_churches:
                percentage = round((count / total_churches) * 100, 1)

            plans.append(
                {
                    "plan": plan_key,
                    "label": labels.get(plan_key, plan_key),
                    "count": count,
                    "percentage": percentage,
                }
            )

        return {"total": total_churches, "plans": plans}

    @staticmethod
    def get_top_churches(limit: int = 10) -> List[Dict[str, Any]]:
        """Top igrejas por número de membros (ativos)."""
        _, start_of_month, _ = PlatformMetricsService._period_bounds()

        churches = (
            Church.objects.filter(is_active=True)
            .annotate(
                members_count=Count("members", filter=Q(members__is_active=True)),
                new_members_month=Count(
                    "members",
                    filter=Q(
                        members__is_active=True,
                        members__created_at__gte=start_of_month,
                    ),
                ),
            )
            .order_by("-members_count", "name")[:limit]
        )

        result = []
        for church in churches:
            result.append(
                {
                    "id": church.id,
                    "name": church.name,
                    "short_name": church.short_name,
                    "city": church.city,
                    "state": church.state,
                    "subscription_plan": church.subscription_plan,
                    "members_count": church.members_count,
                    "new_members_month": church.new_members_month,
                }
            )
        return result

    @staticmethod
    def get_top_churches_by_visitors(limit: int = 10) -> List[Dict[str, Any]]:
        """Top igrejas por visitantes acumulados."""
        churches = (
            Church.objects.filter(is_active=True)
            .annotate(
                visitors_count=Count(
                    "visitors",
                    filter=Q(visitors__is_active=True),
                    distinct=True,
                )
            )
            .order_by("-visitors_count", "name")[:limit]
        )

        return [
            {
                "id": church.id,
                "name": church.name,
                "short_name": church.short_name,
                "city": church.city,
                "state": church.state,
                "subscription_plan": church.subscription_plan,
                "visitors_count": church.visitors_count,
            }
            for church in churches
        ]

    @staticmethod
    def get_data_quality_metrics(
        total_members: int | None = None,
        total_churches: int | None = None,
    ) -> Dict[str, Any]:
        """Indicadores simples de qualidade de dados."""
        if total_members is None:
            total_members = Member.objects.filter(is_active=True).count()
        if total_churches is None:
            total_churches = Church.objects.filter(is_active=True).count()

        members_missing_birth = 0
        if total_members:
            members_missing_birth = Member.objects.filter(
                is_active=True, birth_date__isnull=True
            ).count()

        churches_missing_cnpj = 0
        churches_missing_logo = 0
        churches_missing_cover = 0
        if total_churches:
            churches_missing_cnpj = Church.objects.filter(
                is_active=True,
            ).filter(Q(cnpj__isnull=True) | Q(cnpj="")).count()
            churches_missing_logo = Church.objects.filter(
                is_active=True,
            ).filter(Q(logo__isnull=True) | Q(logo="")).count()
            churches_missing_cover = Church.objects.filter(
                is_active=True,
            ).filter(Q(cover_image__isnull=True) | Q(cover_image="")).count()

        def pct(part, total):
            return round((part / total) * 100, 1) if total else 0.0

        return {
            "members_missing_birth_date": {
                "count": members_missing_birth,
                "percentage": pct(members_missing_birth, total_members),
            },
            "churches_missing_cnpj": {
                "count": churches_missing_cnpj,
                "percentage": pct(churches_missing_cnpj, total_churches),
            },
            "churches_missing_logo": {
                "count": churches_missing_logo,
                "percentage": pct(churches_missing_logo, total_churches),
            },
            "churches_missing_cover": {
                "count": churches_missing_cover,
                "percentage": pct(churches_missing_cover, total_churches),
            },
        }

    @staticmethod
    def get_activity_summary(
        now=None,
        start_of_month=None,
    ) -> Dict[str, Any]:
        """Resumo rápido de atividade (logins e novos cadastros)."""
        if not now:
            now = timezone.now()
        if not start_of_month:
            start_of_month = now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )

        logins_24h = CustomUser.objects.filter(
            is_active=True,
            last_login__gte=now - timedelta(days=1),
        ).count()
        logins_7d = CustomUser.objects.filter(
            is_active=True,
            last_login__gte=now - timedelta(days=7),
        ).count()
        new_members_month = Member.objects.filter(
            is_active=True, created_at__gte=start_of_month
        ).count()
        new_users_month = CustomUser.objects.filter(
            date_joined__gte=start_of_month
        ).count()

        return {
            "logins_24h": logins_24h,
            "logins_7d": logins_7d,
            "new_members_month": new_members_month,
            "new_users_month": new_users_month,
        }

    @staticmethod
    def get_new_members_this_month(now=None, start_of_month=None) -> Dict[str, int]:
        if not now:
            now = timezone.now()
        if not start_of_month:
            start_of_month = now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )

        count = Member.objects.filter(
            is_active=True, created_at__gte=start_of_month
        ).count()
        return {"new_members_month": count}

    @staticmethod
    def get_subscription_alerts(
        days: int = 30,
        limit: int = 15,
        now=None,
    ) -> Dict[str, Any]:
        """Assinaturas expiradas ou que vencem em breve."""
        if not now:
            now = timezone.now()
        soon = now + timedelta(days=days)

        expiring_qs = Church.objects.filter(
            is_active=True,
            subscription_end_date__gte=now,
            subscription_end_date__lte=soon,
        ).order_by("subscription_end_date")

        expired_count = Church.objects.filter(
            is_active=True, subscription_end_date__lt=now
        ).count()

        expiring_count = expiring_qs.count()
        expiring_list = [
            {
                "id": church.id,
                "name": church.name,
                "short_name": church.short_name,
                "subscription_plan": church.subscription_plan,
                "subscription_end_date": church.subscription_end_date,
                "denomination": church.denomination.short_name
                if church.denomination
                else None,
            }
            for church in expiring_qs[:limit]
        ]

        return {
            "expiring_count": expiring_count,
            "expired_count": expired_count,
            "expiring": expiring_list,
            "days_window": days,
        }

    @staticmethod
    def get_geography_map_data() -> List[Dict[str, Any]]:
        """Dados simplificados por estado."""
        states = (
            Church.objects.filter(is_active=True)
            .values("state")
            .annotate(
                churches_count=Count("id"),
                total_users=Count("users__user", distinct=True),
                active_members=Count(
                    "members",
                    filter=Q(members__is_active=True),
                    distinct=True,
                ),
            )
            .order_by("-churches_count", "state")
        )

        result = []
        for item in states:
            code = (item["state"] or "").upper()
            result.append(
                {
                    "code": code,
                    "churches_count": item["churches_count"],
                    "total_users": item["total_users"],
                    "active_members": item["active_members"],
                }
            )
        return result

    # ===================
    # Cached helpers
    # ===================
    @staticmethod
    def get_cached(key: str, producer, ttl: int = 300):
        data = cache.get(key)
        if data is None:
            data = producer()
            cache.set(key, data, ttl)
        return data
