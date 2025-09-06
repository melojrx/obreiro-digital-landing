"""
Django admin para o módulo Messages
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import PrayerRequest, PrayerResponse, PrayerMessage


@admin.register(PrayerRequest)
class PrayerRequestAdmin(admin.ModelAdmin):
    """Admin para Pedidos de Oração"""
    
    list_display = [
        'title', 'author_display', 'category', 'status',
        'prayer_count_display', 'message_count_display',
        'church', 'created_at'
    ]
    
    list_filter = [
        'status', 'category', 'church', 'is_anonymous',
        'allow_visit', 'allow_contact', 'publish_on_wall',
        'created_at'
    ]
    
    search_fields = [
        'title', 'content', 'author__first_name', 
        'author__last_name', 'author__email'
    ]
    
    readonly_fields = [
        'created_at', 'updated_at', 'prayer_count_display',
        'message_count_display'
    ]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('title', 'content', 'category', 'status')
        }),
        ('Autor e Igreja', {
            'fields': ('author', 'church')
        }),
        ('Configurações de Privacidade', {
            'fields': (
                'is_anonymous', 'allow_visit', 'allow_contact',
                'publish_on_wall'
            ),
            'classes': ('collapse',)
        }),
        ('Mídia', {
            'fields': ('image',),
            'classes': ('collapse',)
        }),
        ('Resposta/Testemunho', {
            'fields': ('answered_at', 'answer_testimony'),
            'classes': ('collapse',)
        }),
        ('Metadados', {
            'fields': (
                'prayer_count_display', 'message_count_display',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def author_display(self, obj):
        """Exibe o autor respeitando anonimato"""
        if obj.is_anonymous:
            return "Anônimo"
        return obj.author.get_full_name()
    author_display.short_description = 'Autor'
    
    def prayer_count_display(self, obj):
        """Exibe contador de orações"""
        count = obj.prayer_count
        return format_html(
            '<span style="color: #28a745;">🙏 {}</span>',
            count
        )
    prayer_count_display.short_description = 'Orações'
    
    def message_count_display(self, obj):
        """Exibe contador de mensagens"""
        count = obj.message_count
        if count > 0:
            return format_html(
                '<a href="{}?prayer_request__id={}" style="color: #007bff;">💬 {}</a>',
                reverse('admin:messages_prayermessage_changelist'),
                obj.id,
                count
            )
        return format_html('<span style="color: #6c757d;">💬 0</span>')
    message_count_display.short_description = 'Mensagens'
    
    def get_queryset(self, request):
        """Otimiza consultas"""
        return super().get_queryset(request).select_related(
            'author', 'church'
        ).prefetch_related('prayer_responses', 'prayer_messages')


class PrayerResponseInline(admin.TabularInline):
    """Inline para respostas de oração"""
    model = PrayerResponse
    extra = 0
    readonly_fields = ['created_at']
    fields = ['user', 'is_praying', 'created_at']


class PrayerMessageInline(admin.StackedInline):
    """Inline para mensagens de apoio"""
    model = PrayerMessage
    extra = 0
    readonly_fields = ['created_at']
    fields = ['author', 'content', 'is_anonymous', 'created_at']


@admin.register(PrayerResponse)
class PrayerResponseAdmin(admin.ModelAdmin):
    """Admin para Respostas de Oração"""
    
    list_display = [
        'prayer_request', 'user', 'is_praying', 'created_at'
    ]
    
    list_filter = [
        'is_praying', 'created_at', 'prayer_request__church'
    ]
    
    search_fields = [
        'prayer_request__title', 'user__first_name',
        'user__last_name', 'user__email'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        """Otimiza consultas"""
        return super().get_queryset(request).select_related(
            'prayer_request', 'user'
        )


@admin.register(PrayerMessage)
class PrayerMessageAdmin(admin.ModelAdmin):
    """Admin para Mensagens de Apoio"""
    
    list_display = [
        'prayer_request', 'author_display', 'content_preview',
        'is_anonymous', 'created_at'
    ]
    
    list_filter = [
        'is_anonymous', 'created_at', 'prayer_request__church',
        'prayer_request__category'
    ]
    
    search_fields = [
        'content', 'prayer_request__title',
        'author__first_name', 'author__last_name'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def author_display(self, obj):
        """Exibe o autor respeitando anonimato"""
        if obj.is_anonymous:
            return "Anônimo"
        return obj.author.get_full_name()
    author_display.short_description = 'Autor'
    
    def content_preview(self, obj):
        """Exibe preview do conteúdo"""
        if len(obj.content) > 50:
            return obj.content[:50] + "..."
        return obj.content
    content_preview.short_description = 'Mensagem'
    
    def get_queryset(self, request):
        """Otimiza consultas"""
        return super().get_queryset(request).select_related(
            'prayer_request', 'author'
        )
