from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import UserProfile, ChurchUser

User = get_user_model()


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'get_full_name', 'cpf', 'age_display', 
        'avatar_preview', 'created_at'
    ]
    list_filter = [
        'email_notifications', 'sms_notifications', 'created_at'
    ]
    search_fields = ['user__email', 'user__full_name', 'cpf']
    readonly_fields = ['age_display', 'avatar_preview', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Usuário', {
            'fields': ('user',)
        }),
        ('Dados Pessoais', {
            'fields': ('cpf', 'birth_date', 'age_display', 'bio')
        }),
        ('Avatar', {
            'fields': ('avatar', 'avatar_preview'),
            'classes': ('collapse',)
        }),
        ('Notificações', {
            'fields': ('email_notifications', 'sms_notifications'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_full_name(self, obj):
        return obj.user.display_name
    get_full_name.short_description = 'Nome Completo'
    
    def age_display(self, obj):
        return f"{obj.age} anos" if obj.age else "Não informado"
    age_display.short_description = 'Idade'
    
    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; border-radius: 50%;" />',
                obj.avatar.url
            )
        return "Sem avatar"
    avatar_preview.short_description = 'Preview'


@admin.register(ChurchUser)
class ChurchUserAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'church', 'role', 'role_badge', 'permissions_summary', 
        'joined_at'
    ]
    list_filter = [
        'role', 'church', 'can_access_admin', 'can_manage_members', 
        'can_manage_activities', 'joined_at'
    ]
    search_fields = [
        'user__email', 'user__full_name',
        'church__name', 'church__city'
    ]
    filter_horizontal = ['managed_branches']
    readonly_fields = ['permissions_summary', 'joined_at']
    
    fieldsets = (
        ('Usuário e Igreja', {
            'fields': ('user', 'church', 'role')
        }),
        ('Permissões Automáticas', {
            'fields': ('permissions_summary',),
            'description': 'Permissões baseadas no papel do usuário'
        }),
        ('Permissões Específicas', {
            'fields': (
                'can_access_admin', 'can_manage_members', 'can_manage_visitors',
                'can_manage_activities', 'can_view_reports', 'can_manage_branches'
            ),
            'classes': ('collapse',)
        }),
        ('Filiais Acessíveis', {
            'fields': ('managed_branches',),
            'description': 'Filiais específicas que este usuário pode gerenciar'
        }),
        ('Informações', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        })
    )
    
    def role_badge(self, obj):
        color = obj.get_role_color()
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Papel'
    
    def permissions_summary(self, obj):
        permissions = []
        if obj.can_access_admin:
            permissions.append('🔧 Admin')
        if obj.can_manage_members:
            permissions.append('👥 Membros')
        if obj.can_manage_visitors:
            permissions.append('👋 Visitantes')
        if obj.can_manage_activities:
            permissions.append('📅 Atividades')
        if obj.can_view_reports:
            permissions.append('📊 Relatórios')
        if obj.can_manage_branches:
            permissions.append('🏢 Filiais')
        
        return ', '.join(permissions) if permissions else 'Sem permissões especiais'
    permissions_summary.short_description = 'Resumo de Permissões'


# Extend User Admin to show related profile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Perfil do Usuário'
    fields = ('cpf', 'birth_date', 'avatar')


class ChurchUserInline(admin.TabularInline):
    model = ChurchUser
    extra = 0
    fields = ('church', 'role', 'can_access_admin')
    readonly_fields = ('joined_at',)


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Admin personalizado para CustomUser"""
    
    # Campos para exibição na lista
    list_display = ('email', 'full_name', 'phone', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('email',)
    
    # Fieldsets para edição
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('full_name', 'phone', 'first_name', 'last_name')}),
        ('Permissões', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fieldsets para criação
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone', 'password1', 'password2'),
        }),
    )
    
    # Inlines
    inlines = (UserProfileInline, ChurchUserInline)
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj) 