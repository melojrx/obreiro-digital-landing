"""
Padrões e Validações para Nova Arquitetura
Consistência com core.models e regras de negócio
"""

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from datetime import date, timedelta
from apps.core.models import MembershipStatusChoices


class BusinessRules:
    """
    Regras de negócio para validações
    """
    
    # Idade mínima para responsabilidade
    MINIMUM_AGE_FOR_RESPONSIBILITY = 18
    
    # Idade máxima para dependência
    MAXIMUM_AGE_FOR_DEPENDENCY = 18
    
    # Status que permitem mudança direta
    ALLOWED_STATUS_TRANSITIONS = {
        MembershipStatusChoices.ACTIVE: [
            MembershipStatusChoices.INACTIVE,
            MembershipStatusChoices.TRANSFERRED,
            MembershipStatusChoices.DISCIPLINED,
            MembershipStatusChoices.DECEASED
        ],
        MembershipStatusChoices.INACTIVE: [
            MembershipStatusChoices.ACTIVE,
            MembershipStatusChoices.TRANSFERRED,
            MembershipStatusChoices.DECEASED
        ],
        MembershipStatusChoices.TRANSFERRED: [
            MembershipStatusChoices.ACTIVE,  # Retorno
            MembershipStatusChoices.INACTIVE,
            MembershipStatusChoices.DECEASED
        ],
        MembershipStatusChoices.DISCIPLINED: [
            MembershipStatusChoices.ACTIVE,  # Restauração
            MembershipStatusChoices.INACTIVE,
            MembershipStatusChoices.TRANSFERRED,
            MembershipStatusChoices.DECEASED
        ],
        MembershipStatusChoices.DECEASED: []  # Estado final
    }
    
    # Status que requerem motivo obrigatório
    STATUS_REQUIRING_REASON = [
        MembershipStatusChoices.INACTIVE,
        MembershipStatusChoices.DISCIPLINED,
        MembershipStatusChoices.TRANSFERRED,
        MembershipStatusChoices.DECEASED
    ]
    
    # Funções ministeriais que requerem ordenação
    FUNCTIONS_REQUIRING_ORDINATION = [
        'pastor',
        'evangelist', 
        'elder'
    ]


class MemberValidators:
    """
    Validadores específicos para Member
    """
    
    @staticmethod
    def validate_birth_date(birth_date):
        """Valida data de nascimento"""
        if not birth_date:
            return
        
        today = date.today()
        
        # Não pode ser futura
        if birth_date > today:
            raise ValidationError("Data de nascimento não pode ser futura")
        
        # Não pode ser muito antiga (150 anos)
        max_age_date = today - timedelta(days=150 * 365)
        if birth_date < max_age_date:
            raise ValidationError("Data de nascimento muito antiga")
        
        # Verifica idade mínima para certas ações
        age = today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )
        
        return age
    
    @staticmethod
    def validate_ecclesiastical_dates(birth_date, conversion_date, baptism_date, membership_date):
        """Valida sequência lógica de datas eclesiásticas"""
        dates = {
            'birth_date': birth_date,
            'conversion_date': conversion_date,
            'baptism_date': baptism_date,
            'membership_date': membership_date
        }
        
        # Remove datas vazias
        valid_dates = {k: v for k, v in dates.items() if v}
        
        # Validações de ordem lógica
        if 'conversion_date' in valid_dates and 'birth_date' in valid_dates:
            if valid_dates['conversion_date'] < valid_dates['birth_date']:
                raise ValidationError("Data de conversão não pode ser anterior ao nascimento")
        
        if 'baptism_date' in valid_dates and 'conversion_date' in valid_dates:
            if valid_dates['baptism_date'] < valid_dates['conversion_date']:
                raise ValidationError("Data de batismo não pode ser anterior à conversão")
        
        if 'membership_date' in valid_dates and 'birth_date' in valid_dates:
            if valid_dates['membership_date'] < valid_dates['birth_date']:
                raise ValidationError("Data de membresia não pode ser anterior ao nascimento")
        
        # Idade mínima para conversão (razoabilidade)
        if 'conversion_date' in valid_dates and 'birth_date' in valid_dates:
            conversion_age = valid_dates['conversion_date'].year - valid_dates['birth_date'].year
            if conversion_age < 3:  # Idade mínima razoável
                raise ValidationError("Idade na conversão muito baixa")
    
    @staticmethod
    def validate_ministerial_function(function, ordination_date, birth_date):
        """Valida função ministerial e ordenação"""
        if not function:
            return
        
        # Funções que requerem ordenação
        if function in BusinessRules.FUNCTIONS_REQUIRING_ORDINATION:
            if not ordination_date:
                raise ValidationError(f"Função '{function}' requer data de ordenação")
        
        # Idade mínima para certas funções
        if birth_date and function in ['pastor', 'elder']:
            today = date.today()
            age = today.year - birth_date.year - (
                (today.month, today.day) < (birth_date.month, birth_date.day)
            )
            
            if age < 25:  # Idade mínima para pastor/presbítero
                raise ValidationError(f"Idade mínima para {function} é 25 anos")
    
    @staticmethod
    def validate_family_relationships(member, spouse, responsible):
        """Valida relacionamentos familiares"""
        # Cônjuge não pode ser o próprio membro
        if spouse and spouse.id == member.id:
            raise ValidationError("Membro não pode ser cônjuge de si mesmo")
        
        # Responsável não pode ser o próprio membro
        if responsible and responsible.id == member.id:
            raise ValidationError("Membro não pode ser responsável por si mesmo")
        
        # Se tem responsável, deve ser menor de idade
        if responsible and member.birth_date:
            age = MemberValidators.validate_birth_date(member.birth_date)
            if age >= BusinessRules.MAXIMUM_AGE_FOR_DEPENDENCY:
                raise ValidationError("Membro maior de idade não pode ter responsável")
        
        # Responsável deve ser maior de idade
        if responsible and responsible.birth_date:
            responsible_age = MemberValidators.validate_birth_date(responsible.birth_date)
            if responsible_age < BusinessRules.MINIMUM_AGE_FOR_RESPONSIBILITY:
                raise ValidationError("Responsável deve ser maior de idade")


class MembershipStatusValidators:
    """
    Validadores para mudanças de status
    """
    
    @staticmethod
    def validate_status_transition(current_status, new_status):
        """Valida se a transição de status é permitida"""
        if current_status == new_status:
            raise ValidationError("Novo status deve ser diferente do atual")
        
        allowed_transitions = BusinessRules.ALLOWED_STATUS_TRANSITIONS.get(current_status, [])
        
        if new_status not in allowed_transitions:
            raise ValidationError(
                f"Transição de '{current_status}' para '{new_status}' não é permitida"
            )
    
    @staticmethod
    def validate_status_reason(status, reason):
        """Valida motivo obrigatório para certos status"""
        if status in BusinessRules.STATUS_REQUIRING_REASON:
            if not reason or not reason.strip():
                raise ValidationError(f"Motivo é obrigatório para status '{status}'")
    
    @staticmethod
    def validate_effective_date(effective_date, member_birth_date=None):
        """Valida data efetiva do status"""
        if not effective_date:
            return
        
        today = date.today()
        
        # Não pode ser muito no futuro (30 dias)
        max_future_date = today + timedelta(days=30)
        if effective_date > max_future_date:
            raise ValidationError("Data efetiva não pode ser mais de 30 dias no futuro")
        
        # Se fornecida data de nascimento, não pode ser anterior
        if member_birth_date and effective_date < member_birth_date:
            raise ValidationError("Data efetiva não pode ser anterior ao nascimento")


class DataIntegrityCheckers:
    """
    Verificadores de integridade de dados
    """
    
    @staticmethod
    def check_duplicate_cpf(cpf, church=None, exclude_member_id=None):
        """Verifica CPF duplicado no escopo da denominação (ou igreja se denominação ausente)."""
        if not cpf:
            return True
        
        from apps.members.models import Member
        
        query = Member.objects.filter(cpf=cpf, is_active=True)
        if exclude_member_id:
            query = query.exclude(id=exclude_member_id)
        if church and getattr(church, 'denomination_id', None):
            query = query.filter(church__denomination_id=church.denomination_id)
        elif church:
            query = query.filter(church=church)
        
        if query.exists():
            raise ValidationError(f"CPF {cpf} já está em uso na denominação")
        
        return True
    
    @staticmethod
    def check_email_uniqueness(email, church, exclude_member_id=None):
        """Verifica unicidade de email por igreja"""
        if not email:
            return True
        
        from apps.members.models import Member
        
        query = Member.objects.filter(email=email, church=church)
        if exclude_member_id:
            query = query.exclude(id=exclude_member_id)
        
        if query.exists():
            raise ValidationError(f"Email {email} já está em uso nesta igreja")
        
        return True
    
    @staticmethod
    def check_membership_consistency():
        """Verifica consistência geral da membresia"""
        from apps.members.models import Member
        from apps.members.models_new import MembershipStatus
        
        issues = []
        
        # Membros sem status atual
        members_without_status = Member.objects.exclude(
            membership_statuses__is_current=True
        ).count()
        
        if members_without_status > 0:
            issues.append(f"{members_without_status} membros sem status atual")
        
        # Membros com múltiplos status atuais
        duplicate_current_status = MembershipStatus.objects.values('member').annotate(
            current_count=models.Count('id', filter=models.Q(is_current=True))
        ).filter(current_count__gt=1).count()
        
        if duplicate_current_status > 0:
            issues.append(f"{duplicate_current_status} membros com múltiplos status atuais")
        
        return issues


class PermissionValidators:
    """
    Validadores de permissões para ações
    """
    
    @staticmethod
    def can_change_status(user, member, new_status):
        """Verifica se usuário pode alterar status do membro"""
        # Super admin pode tudo
        if user.is_superuser:
            return True
        
        # Verifica se usuário tem permissão na igreja do membro
        user_church_roles = user.church_users.filter(
            church=member.church,
            is_active=True
        )
        
        if not user_church_roles.exists():
            raise ValidationError("Usuário não tem permissão nesta igreja")
        
        # Church Admin pode alterar qualquer status
        from apps.accounts.models import RoleChoices
        if user_church_roles.filter(role=RoleChoices.CHURCH_ADMIN).exists():
            return True
        
        # Pastor pode alterar maioria dos status
        if user_church_roles.filter(role=RoleChoices.PASTOR).exists():
            restricted_statuses = [MembershipStatusChoices.DECEASED]
            if new_status not in restricted_statuses:
                return True
        
        raise ValidationError("Usuário não tem permissão para esta alteração")
    
    @staticmethod
    def can_manage_member(user, member):
        """Verifica se usuário pode gerenciar membro"""
        # Implementação similar ao can_change_status
        # mas para operações gerais de CRUD
        return PermissionValidators.can_change_status(user, member, member.membership_status)


class StandardizedChoices:
    """
    Choices padronizados conforme core.models
    """
    
    # Estados civis padronizados
    MARITAL_STATUS_CHOICES = [
        ('single', 'Solteiro(a)'),
        ('married', 'Casado(a)'),
        ('divorced', 'Divorciado(a)'),
        ('widowed', 'Viúvo(a)'),
        ('stable_union', 'União Estável'),
        ('separated', 'Separado(a)'),
        ('other', 'Outro'),
    ]
    
    # Níveis de escolaridade padronizados
    EDUCATION_LEVEL_CHOICES = [
        ('elementary_incomplete', 'Fundamental Incompleto'),
        ('elementary_complete', 'Fundamental Completo'),
        ('high_school_incomplete', 'Médio Incompleto'),
        ('high_school_complete', 'Médio Completo'),
        ('technical', 'Técnico'),
        ('higher_incomplete', 'Superior Incompleto'),
        ('higher_complete', 'Superior Completo'),
        ('postgraduate', 'Pós-graduação'),
        ('masters', 'Mestrado'),
        ('doctorate', 'Doutorado'),
        ('postdoc', 'Pós-doutorado'),
    ]
    
    # Funções ministeriais padronizadas (conforme nova tabela)
    MINISTERIAL_FUNCTION_CHOICES = [
        ('member', 'Membro'),
        ('cooperator', 'Cooperador'),
        ('auxiliary', 'Auxiliar'),
        ('leader', 'Líder'),
        ('deacon', 'Diácono'),
        ('deaconess', 'Diaconisa'),
        ('elder', 'Presbítero'),
        ('evangelist', 'Evangelista'),
        ('pastor', 'Pastor'),
        ('missionary', 'Missionário'),
        ('bishop', 'Bispo'),
        ('apostle', 'Apóstolo'),
    ]


# Função helper para aplicar todas as validações
def validate_member_data(member_data, current_member=None):
    """
    Aplica todas as validações de membro
    """
    errors = []
    
    try:
        # Validações básicas
        if 'birth_date' in member_data:
            MemberValidators.validate_birth_date(member_data['birth_date'])
        
        # Validações de datas eclesiásticas
        MemberValidators.validate_ecclesiastical_dates(
            member_data.get('birth_date'),
            member_data.get('conversion_date'),
            member_data.get('baptism_date'),
            member_data.get('membership_date')
        )
        
        # Validações de função ministerial
        MemberValidators.validate_ministerial_function(
            member_data.get('ministerial_function'),
            member_data.get('ordination_date'),
            member_data.get('birth_date')
        )
        
        # Validações de integridade
        if 'cpf' in member_data:
            DataIntegrityCheckers.check_duplicate_cpf(
                member_data['cpf'],
                current_member.id if current_member else None
            )
        
        if 'email' in member_data and 'church' in member_data:
            DataIntegrityCheckers.check_email_uniqueness(
                member_data['email'],
                member_data['church'],
                current_member.id if current_member else None
            )
        
    except ValidationError as e:
        errors.append(str(e))
    
    if errors:
        raise ValidationError(errors)
    
    return True
