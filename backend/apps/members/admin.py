from django.contrib import admin
from .models import Member, MembershipStatus, MembershipStatusLog, MemberTransferLog, BranchTransferLog, MinisterialFunctionHistory


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    """Admin configuration for Member model"""
    list_display = [
        'full_name', 'church', 'membership_status', 'ministerial_function',
        'membership_date', 'is_active'
    ]
    list_filter = [
        'church', 'membership_status', 'ministerial_function', 'gender', 
        'marital_status', 'is_active', 'created_at'
    ]
    search_fields = ['full_name', 'cpf', 'email', 'phone']
    ordering = ['church', 'full_name']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('church', 'user', 'full_name', 'cpf', 'rg')
        }),
        ('Dados Pessoais', {
            'fields': ('birth_date', 'gender', 'marital_status', 'profession', 'education_level')
        }),
        ('Contato', {
            'fields': ('email', 'phone', 'phone_secondary')
        }),
        ('Endereço', {
            'fields': ('address', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode')
        }),
        ('Dados Eclesiásticos', {
            'fields': ('membership_status', 'baptism_date', 'membership_date', 
                      'previous_church', 'transfer_letter')
        }),
        ('Dados Ministeriais', {
            'fields': ('ministerial_function', 'ministries')
        }),
        ('Dados Familiares', {
            'fields': ('spouse', 'children_count', 'responsible')
        }),
        ('Adicional', {
            'fields': ('photo', 'notes', 'accept_sms', 'accept_email', 'accept_whatsapp')
        }),
        ('Controle', {
            'fields': ('is_active',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MembershipStatus)
class MembershipStatusAdmin(admin.ModelAdmin):
    """Admin configuration for MembershipStatus model"""
    list_display = [
        'member', 'status', 'effective_date', 'end_date', 'is_current'
    ]
    list_filter = ['status', 'effective_date', 'end_date', 'is_active']
    search_fields = ['member__full_name', 'observation']
    ordering = ['member', '-effective_date']


@admin.register(MembershipStatusLog)
class MembershipStatusLogAdmin(admin.ModelAdmin):
    """Admin configuration for MembershipStatusLog model"""
    list_display = [
        'member', 'old_status', 'new_status', 'changed_by', 'created_at'
    ]
    list_filter = ['old_status', 'new_status', 'created_at']
    search_fields = ['member__full_name', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MemberTransferLog)
class MemberTransferLogAdmin(admin.ModelAdmin):
    """Admin configuration for MemberTransferLog model"""
    list_display = [
        'member', 'from_church', 'to_church', 'transferred_by', 'created_at'
    ]
    list_filter = ['from_church', 'to_church', 'created_at']
    search_fields = ['member__full_name', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BranchTransferLog)
class BranchTransferLogAdmin(admin.ModelAdmin):
    """Admin configuration for BranchTransferLog model - FASE 2"""
    list_display = [
        'member', 'from_branch', 'to_branch', 'transfer_date', 'transfer_type', 'transferred_by'
    ]
    list_filter = ['transfer_type', 'transfer_date', 'from_branch', 'to_branch']
    search_fields = ['member__full_name', 'reason']
    ordering = ['-transfer_date', '-created_at']
    readonly_fields = ['created_at', 'updated_at', 'duration_in_previous_branch']
    
    fieldsets = (
        ('Informações da Transferência', {
            'fields': ('member', 'from_branch', 'to_branch', 'transfer_date', 'transfer_type')
        }),
        ('Dados da Congregação Anterior', {
            'fields': ('previous_membership_start_date', 'duration_in_previous_branch')
        }),
        ('Detalhes', {
            'fields': ('transferred_by', 'reason')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(MinisterialFunctionHistory)
class MinisterialFunctionHistoryAdmin(admin.ModelAdmin):
    list_display = ['member', 'function', 'start_date', 'end_date', 'is_active']
    list_filter = ['function', 'start_date', 'end_date', 'is_active']
    search_fields = ['member__full_name', 'notes']
    ordering = ['member', '-start_date']
    readonly_fields = ['created_at', 'updated_at']
