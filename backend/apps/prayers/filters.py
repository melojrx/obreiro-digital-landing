import django_filters
from django.db import models
from .models import PrayerRequest


class PrayerRequestFilter(django_filters.FilterSet):
    """
    Filtros para pedidos de oração
    """
    
    # Filtros por categoria
    category = django_filters.ChoiceFilter(
        choices=PrayerRequest.CATEGORY_CHOICES,
        field_name='category',
        lookup_expr='exact'
    )
    
    # Filtros por status
    status = django_filters.ChoiceFilter(
        choices=PrayerRequest.STATUS_CHOICES,
        field_name='status',
        lookup_expr='exact'
    )
    
    # Filtro por data de criação
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='date__gte',
        label='Criado após'
    )
    
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='date__lte',
        label='Criado antes'
    )
    
    # Filtro por mês
    created_month = django_filters.NumberFilter(
        field_name='created_at',
        lookup_expr='month',
        label='Mês de criação'
    )
    
    # Filtro por ano
    created_year = django_filters.NumberFilter(
        field_name='created_at',
        lookup_expr='year',
        label='Ano de criação'
    )
    
    # Filtros booleanos
    is_anonymous = django_filters.BooleanFilter(
        field_name='is_anonymous',
        label='Anônimo'
    )
    
    allow_visit = django_filters.BooleanFilter(
        field_name='allow_visit',
        label='Permite visita'
    )
    
    allow_contact = django_filters.BooleanFilter(
        field_name='allow_contact',
        label='Permite contato'
    )
    
    publish_on_wall = django_filters.BooleanFilter(
        field_name='publish_on_wall',
        label='Publicar no mural'
    )
    
    # Filtro por autor (ID)
    author = django_filters.NumberFilter(
        field_name='author__id',
        lookup_expr='exact',
        label='Autor (ID)'
    )
    
    # Filtro por igreja (ID)
    church = django_filters.NumberFilter(
        field_name='church__id',
        lookup_expr='exact',
        label='Igreja (ID)'
    )
    
    # Filtro de busca por título ou conteúdo
    search = django_filters.CharFilter(
        method='filter_search',
        label='Buscar'
    )
    
    # Filtros personalizados
    has_messages = django_filters.BooleanFilter(
        method='filter_has_messages',
        label='Tem mensagens'
    )
    
    has_prayers = django_filters.BooleanFilter(
        method='filter_has_prayers',
        label='Tem orações'
    )
    
    answered_this_month = django_filters.BooleanFilter(
        method='filter_answered_this_month',
        label='Respondido este mês'
    )
    
    class Meta:
        model = PrayerRequest
        fields = {
            'title': ['icontains', 'iexact'],
            'content': ['icontains'],
            'created_at': ['exact', 'date', 'date__gte', 'date__lte'],
            'updated_at': ['exact', 'date', 'date__gte', 'date__lte'],
            'answered_at': ['exact', 'date', 'date__gte', 'date__lte', 'isnull'],
        }
    
    def filter_search(self, queryset, name, value):
        """Busca por título ou conteúdo"""
        if not value:
            return queryset
        
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(content__icontains=value)
        )
    
    def filter_has_messages(self, queryset, name, value):
        """Filtra pedidos que têm mensagens de apoio"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(
                messages__is_active=True
            ).distinct()
        else:
            return queryset.exclude(
                messages__is_active=True
            )
    
    def filter_has_prayers(self, queryset, name, value):
        """Filtra pedidos que têm pessoas orando"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(
                responses__is_praying=True,
                responses__is_active=True
            ).distinct()
        else:
            return queryset.exclude(
                responses__is_praying=True,
                responses__is_active=True
            )
    
    def filter_answered_this_month(self, queryset, name, value):
        """Filtra pedidos respondidos neste mês"""
        if value is None:
            return queryset
        
        from django.utils import timezone
        now = timezone.now()
        
        if value:
            return queryset.filter(
                status='answered',
                answered_at__month=now.month,
                answered_at__year=now.year
            )
        else:
            return queryset.exclude(
                status='answered',
                answered_at__month=now.month,
                answered_at__year=now.year
            )
