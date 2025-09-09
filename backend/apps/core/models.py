"""
Core models - Classes abstratas e utilitários fundamentais
Seguindo as melhores práticas Django para reutilização e consistência
"""

import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


class TimestampedModel(models.Model):
    """
    Classe abstrata que adiciona timestamps automáticos.
    Todos os models do sistema devem herdar desta classe.
    """
    created_at = models.DateTimeField(
        "Criado em", 
        auto_now_add=True,
        help_text="Data e hora de criação do registro"
    )
    updated_at = models.DateTimeField(
        "Atualizado em", 
        auto_now=True,
        help_text="Data e hora da última atualização"
    )

    class Meta:
        abstract = True


class BaseModel(TimestampedModel):
    """
    Classe abstrata base com funcionalidades comuns:
    - Timestamps automáticos
    - Soft delete (is_active)
    - UUID para identificação externa
    - Manager customizado
    """
    uuid = models.UUIDField(
        "UUID", 
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        help_text="Identificador único universal"
    )
    is_active = models.BooleanField(
        "Ativo", 
        default=True,
        help_text="Indica se o registro está ativo no sistema"
    )

    class Meta:
        abstract = True

    def soft_delete(self):
        """Soft delete - marca como inativo ao invés de deletar"""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])

    def restore(self):
        """Restaura um registro deletado"""
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])


class ActiveManager(models.Manager):
    """
    Manager que filtra apenas registros ativos por padrão.
    Usado em models com soft delete.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class TenantQuerySet(models.QuerySet):
    """
    QuerySet que aplica o filtro de tenant (igreja) automaticamente.
    """
    def for_church(self, church):
        if not church:
            # Se não houver igreja no contexto, retorna um queryset vazio
            # para evitar vazamento de dados.
            return self.none()
        return self.filter(church=church)

class TenantManager(models.Manager):
    """
    Manager para models multi-tenant. Filtra automaticamente pela
    igreja do usuário logado, obtida a partir do request.
    """
    def get_queryset(self):
        """
        Sobrescreve o queryset padrão para aplicar o filtro de tenant.
        """
        from .middleware import get_current_request # Importação movida para cá
        
        qs = TenantQuerySet(self.model, using=self._db).filter(is_active=True)
        
        request = get_current_request()
        if request and hasattr(request, 'church') and request.church:
            return qs.for_church(request.church)
        
        # Se não houver request ou church (ex: em scripts, shell),
        # retorna o queryset de ativos, mas sem filtro de tenant.
        # Adicionar um warning aqui pode ser útil em desenvolvimento.
        # import warnings
        # warnings.warn("TenantManager usado sem um request de igreja no contexto.")
        return qs
    
    def all_for_church(self, church):
        """
        Retorna TODOS os registros para uma igreja, incluindo os inativos.
        Útil para tarefas administrativas.
        """
        return TenantQuerySet(self.model, using=self._db).for_church(church)

# =================================
# VALIDATORS CUSTOMIZADOS
# =================================

def validate_cpf(value):
    """Validador para CPF brasileiro"""
    if not value:
        return
    
    # Remove caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, value))
    
    if len(cpf) != 11:
        raise ValidationError('CPF deve ter 11 dígitos')
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        raise ValidationError('CPF inválido')
    
    # Algoritmo de validação do CPF
    def calculate_digit(cpf_partial, weights):
        sum_digits = sum(int(digit) * weight for digit, weight in zip(cpf_partial, weights))
        remainder = sum_digits % 11
        return 0 if remainder < 2 else 11 - remainder
    
    # Primeiro dígito verificador
    first_digit = calculate_digit(cpf[:9], range(10, 1, -1))
    if int(cpf[9]) != first_digit:
        raise ValidationError('CPF inválido')
    
    # Segundo dígito verificador
    second_digit = calculate_digit(cpf[:10], range(11, 1, -1))
    if int(cpf[10]) != second_digit:
        raise ValidationError('CPF inválido')


def validate_cnpj(value):
    """Validador para CNPJ brasileiro"""
    if not value:
        return
    
    # Remove caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, value))
    
    if len(cnpj) != 14:
        raise ValidationError('CNPJ deve ter 14 dígitos')
    
    # Verifica se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        raise ValidationError('CNPJ inválido')
    
    # Algoritmo de validação do CNPJ
    def calculate_digit(cnpj_partial, weights):
        sum_digits = sum(int(digit) * weight for digit, weight in zip(cnpj_partial, weights))
        remainder = sum_digits % 11
        return 0 if remainder < 2 else 11 - remainder
    
    # Primeiro dígito verificador
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    first_digit = calculate_digit(cnpj[:12], weights1)
    if int(cnpj[12]) != first_digit:
        raise ValidationError('CNPJ inválido')
    
    # Segundo dígito verificador
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    second_digit = calculate_digit(cnpj[:13], weights2)
    if int(cnpj[13]) != second_digit:
        raise ValidationError('CNPJ inválido')


# Validadores regex para telefone brasileiro
phone_validator = RegexValidator(
    regex=r'^\(\d{2}\)\s\d{4,5}-\d{4}$',
    message='Telefone deve estar no formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'
)

cep_validator = RegexValidator(
    regex=r'^\d{5}-\d{3}$',
    message='CEP deve estar no formato: XXXXX-XXX'
)


# =================================
# CHOICES PARA CAMPOS
# =================================

class GenderChoices(models.TextChoices):
    """Choices para gênero"""
    MALE = 'M', 'Masculino'
    FEMALE = 'F', 'Feminino'




class SubscriptionPlanChoices(models.TextChoices):
    """Planos de assinatura SaaS"""
    BASIC = 'basic', 'Básico'
    PROFESSIONAL = 'professional', 'Profissional'
    ENTERPRISE = 'enterprise', 'Enterprise'
    DENOMINATION = 'denomination', 'Denominação'


class SubscriptionStatusChoices(models.TextChoices):
    """Status da assinatura"""
    ACTIVE = 'active', 'Ativa'
    EXPIRED = 'expired', 'Expirada'
    CANCELLED = 'cancelled', 'Cancelada'
    SUSPENDED = 'suspended', 'Suspensa'
    TRIAL = 'trial', 'Período de teste'


class RoleChoices(models.TextChoices):
    """Papéis de usuário no sistema"""
    SUPER_ADMIN = 'super_admin', 'Super Administrador'
    DENOMINATION_ADMIN = 'denomination_admin', 'Administrador de Denominação'
    CHURCH_ADMIN = 'church_admin', 'Administrador da Igreja'
    PASTOR = 'pastor', 'Pastor'
    SECRETARY = 'secretary', 'Secretário(a)'
    LEADER = 'leader', 'Líder'
    MEMBER = 'member', 'Membro'
    READ_ONLY = 'read_only', 'Somente Leitura'


class MembershipStatusChoices(models.TextChoices):
    """Status de membresia"""
    ACTIVE = 'active', 'Ativo'
    INACTIVE = 'inactive', 'Inativo'
    TRANSFERRED = 'transferred', 'Transferido'
    DISCIPLINED = 'disciplined', 'Disciplinado'
    DECEASED = 'deceased', 'Falecido'


class MinisterialFunctionChoices(models.TextChoices):
    """Funções ministeriais"""
    MEMBER = 'member', 'Membro'
    DEACON = 'deacon', 'Diácono'
    DEACONESS = 'deaconess', 'Diaconisa'
    ELDER = 'elder', 'Presbítero'
    EVANGELIST = 'evangelist', 'Evangelista'
    PASTOR = 'pastor', 'Pastor'
    MISSIONARY = 'missionary', 'Missionário'
    LEADER = 'leader', 'Líder'
    COOPERATOR = 'cooperator', 'Cooperador'
    AUXILIARY = 'auxiliary', 'Auxiliar'
