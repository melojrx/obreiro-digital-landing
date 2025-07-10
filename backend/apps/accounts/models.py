"""
Accounts models - Sistema de usuários e permissões multi-tenant
Gerencia papéis hierárquicos e acesso por igreja
"""

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from apps.core.models import BaseModel, ActiveManager, RoleChoices, GenderChoices
from apps.core.models import validate_cpf, phone_validator


class CustomUserManager(BaseUserManager):
    """
    Manager personalizado para CustomUser que usa email como campo de login.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Cria e salva um usuário regular com email e senha.
        """
        if not email:
            raise ValueError('O campo email é obrigatório')
        
        email = self.normalize_email(email)
        
        # Se não tem username, usar parte do email
        if 'username' not in extra_fields:
            extra_fields['username'] = email.split('@')[0]
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Cria e salva um superusuário com email e senha.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser deve ter is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Modelo de usuário personalizado que usa email como campo de login.
    Estende o AbstractUser do Django para usar email ao invés de username.
    """
    
    # Sobrescrever email para ser único e obrigatório
    email = models.EmailField(
        "E-mail",
        unique=True,
        help_text="Endereço de e-mail único para login"
    )
    
    # Campos adicionais para registro inicial
    full_name = models.CharField(
        "Nome Completo",
        max_length=200,
        help_text="Nome completo do usuário"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        help_text="Telefone no formato (XX) XXXXX-XXXX"
    )
    
    # Estes campos foram movidos para UserProfile para melhor normalização.
    # birth_date = models.DateField(
    #     "Data de Nascimento",
    #     null=True,
    #     help_text="Data de nascimento do usuário"
    # )
    
    # gender = models.CharField(
    #     "Gênero",
    #     max_length=1,
    #     choices=[('M', 'Masculino'), ('F', 'Feminino'), ('O', 'Outro'), ('N', 'Não informar')],
    #     blank=True,
    #     null=True
    # )
    
    # Novo campo para rastrear o status do cadastro
    is_profile_complete = models.BooleanField(
        default=False,
        verbose_name="Perfil Completo",
        help_text="Indica se o usuário completou todas as etapas do cadastro."
    )
    
    # Configurar email como campo de login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']  # Campos obrigatórios além do email
    
    # Usar o manager personalizado
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ['full_name', 'email']
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    @property
    def display_name(self):
        """Nome para exibição"""
        return self.full_name or self.get_full_name() or self.email
    
    @property
    def age(self):
        """Calcula idade se data de nascimento disponível no perfil"""
        if hasattr(self, 'profile') and self.profile.birth_date:
            from datetime import date
            today = date.today()
            return today.year - self.profile.birth_date.year - (
                (today.month, today.day) < (self.profile.birth_date.month, self.profile.birth_date.day)
            )
        return None
    
    def save(self, *args, **kwargs):
        """Override save para garantir consistência"""
        # Se não tem username, usar parte do email
        if not self.username:
            self.username = self.email.split('@')[0]
        
        # Se não tem first_name/last_name, dividir full_name
        if self.full_name and not (self.first_name or self.last_name):
            name_parts = self.full_name.split(' ', 1)
            self.first_name = name_parts[0]
            if len(name_parts) > 1:
                self.last_name = name_parts[1]
        
        super().save(*args, **kwargs)


class ChurchUserManager(models.Manager):
    """Manager para usuários de igreja com filtros especializados"""
    
    def for_church(self, church):
        """Usuários de uma igreja específica"""
        return self.get_queryset().filter(church=church, is_active=True)
    
    def admins_for_church(self, church):
        """Administradores de uma igreja"""
        return self.for_church(church).filter(
            role__in=[RoleChoices.CHURCH_ADMIN, RoleChoices.PASTOR]
        )
    
    def leaders_for_church(self, church):
        """Líderes de uma igreja"""
        return self.for_church(church).filter(
            role__in=[
                RoleChoices.CHURCH_ADMIN,
                RoleChoices.PASTOR,
                RoleChoices.SECRETARY,
                RoleChoices.LEADER
            ]
        )


class UserProfile(BaseModel):
    """
    Perfil estendido do usuário com dados pessoais.
    Complementa o CustomUser com informações eclesiásticas.
    """
    
    user = models.OneToOneField(
        'accounts.CustomUser',  # Atualizado para usar CustomUser
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="Usuário",
        help_text="Usuário relacionado"
    )
    
    # Dados pessoais adicionais
    birth_date = models.DateField(
        "Data de Nascimento",
        blank=True,
        null=True,
        help_text="Data de nascimento"
    )
    
    gender = models.CharField(
        "Gênero",
        max_length=1,
        choices=GenderChoices.choices,
        blank=True,
        null=True,
        help_text="Gênero do usuário"
    )

    cpf = models.CharField(
        "CPF",
        max_length=14,
        unique=True,
        blank=True,
        null=True,
        validators=[validate_cpf],
        help_text="CPF do usuário (opcional)"
    )
    
    # Foto de perfil
    avatar = models.ImageField(
        "Foto do Perfil",
        upload_to='profiles/avatars/',
        blank=True,
        null=True,
        help_text="Foto do perfil do usuário"
    )
    
    # Preferências
    email_notifications = models.BooleanField(
        "Notificações por E-mail",
        default=True,
        help_text="Receber notificações por e-mail"
    )
    
    sms_notifications = models.BooleanField(
        "Notificações por SMS",
        default=False,
        help_text="Receber notificações por SMS"
    )
    
    # Dados de acesso
    last_login_ip = models.GenericIPAddressField(
        "Último IP de Login",
        blank=True,
        null=True,
        help_text="Último endereço IP usado para login"
    )
    
    # Bio profissional
    bio = models.TextField(
        "Bio",
        blank=True,
        default='',
        help_text="Biografia ou descrição do usuário"
    )
    
    # Managers
    objects = models.Manager()
    active = ActiveManager()
    
    class Meta:
        verbose_name = "Perfil de Usuário"
        verbose_name_plural = "Perfis de Usuários"
        ordering = ['user__full_name']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['cpf']),
        ]
    
    def __str__(self):
        return f"Perfil de {self.user.display_name}"
    
    @property
    def age(self):
        """Calcula idade se data de nascimento disponível"""
        if self.birth_date:
            from datetime import date
            today = date.today()
            return today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        return None


class ChurchUser(BaseModel):
    """
    Relacionamento entre usuário e igreja com papéis específicos.
    Um usuário pode ter diferentes papéis em diferentes igrejas.
    """
    
    user = models.ForeignKey(
        'accounts.CustomUser',  # Atualizado para usar CustomUser
        on_delete=models.CASCADE,
        related_name='church_users',
        verbose_name="Usuário",
        help_text="Usuário do sistema"
    )
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name="Igreja",
        help_text="Igreja à qual o usuário pertence"
    )
    
    role = models.CharField(
        "Papel",
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.MEMBER,
        help_text="Papel do usuário nesta igreja"
    )
    
    # Dados de acesso
    can_access_admin = models.BooleanField(
        "Acesso ao Admin",
        default=False,
        help_text="Se pode acessar área administrativa"
    )
    
    can_manage_members = models.BooleanField(
        "Gerenciar Membros",
        default=False,
        help_text="Se pode gerenciar membros"
    )
    
    can_manage_visitors = models.BooleanField(
        "Gerenciar Visitantes",
        default=False,
        help_text="Se pode gerenciar visitantes"
    )
    
    can_manage_activities = models.BooleanField(
        "Gerenciar Atividades",
        default=False,
        help_text="Se pode gerenciar atividades"
    )
    
    can_view_reports = models.BooleanField(
        "Ver Relatórios",
        default=False,
        help_text="Se pode visualizar relatórios"
    )
    
    can_manage_branches = models.BooleanField(
        "Gerenciar Filiais",
        default=False,
        help_text="Se pode gerenciar filiais"
    )
    
    # Filiais específicas que pode gerenciar
    managed_branches = models.ManyToManyField(
        'branches.Branch',
        blank=True,
        related_name='managers',
        verbose_name="Filiais Gerenciadas",
        help_text="Filiais específicas que este usuário pode gerenciar"
    )
    
    # Data de ingresso na igreja
    joined_at = models.DateTimeField(
        "Data de Ingresso",
        auto_now_add=True,
        help_text="Data que entrou na igreja"
    )
    
    # Observações
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre este usuário"
    )
    
    # Managers
    objects = ChurchUserManager()
    active = ActiveManager()
    
    class Meta:
        verbose_name = "Usuário da Igreja"
        verbose_name_plural = "Usuários da Igreja"
        unique_together = [['user', 'church']]  # Um usuário por igreja
        ordering = ['church', 'role', 'user__email']
        indexes = [
            models.Index(fields=['user', 'church']),
            models.Index(fields=['church', 'role']),
            models.Index(fields=['church', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.display_name} - {self.get_role_display()} em {self.church.short_name}"
    
    def save(self, *args, **kwargs):
        """Override save para configurar permissões automáticas baseadas no papel"""
        # Validar que SUPER_ADMIN não pode ser atribuído via aplicação
        if self.role == RoleChoices.SUPER_ADMIN:
            # Permitir apenas se for um superuser do Django fazendo a operação
            # ou se o registro já existia com esse papel
            if not self.pk:  # Novo registro
                raise ValidationError(
                    "O papel de Super Administrador não pode ser atribuído via aplicação. "
                    "Este papel é reservado apenas para desenvolvedores da plataforma."
                )
        
        if not self.pk:  # Novo registro
            self.set_permissions_by_role()
        
        super().save(*args, **kwargs)
    
    def set_permissions_by_role(self):
        """
        Define permissões automáticas baseadas no papel do usuário.
        Chamado automaticamente ao criar um novo ChurchUser.
        """
        
        # Reset all permissions
        self.can_access_admin = False
        self.can_manage_members = False
        self.can_manage_visitors = False
        self.can_manage_activities = False
        self.can_view_reports = False
        self.can_manage_branches = False
        
        # Set permissions based on role
        if self.role == RoleChoices.SUPER_ADMIN or self.role == RoleChoices.DENOMINATION_ADMIN:
            # Super admin e Admin de Denominação têm todas as permissões
            self.can_access_admin = True
            self.can_manage_members = True
            self.can_manage_visitors = True
            self.can_manage_activities = True
            self.can_view_reports = True
            self.can_manage_branches = True
            
        elif self.role == RoleChoices.CHURCH_ADMIN:
            # Admin da igreja tem quase todas as permissões
            self.can_access_admin = True
            self.can_manage_members = True
            self.can_manage_visitors = True
            self.can_manage_activities = True
            self.can_view_reports = True
            self.can_manage_branches = True
            
        elif self.role == RoleChoices.PASTOR:
            # Pastor tem permissões administrativas
            self.can_access_admin = True
            self.can_manage_members = True
            self.can_manage_visitors = True
            self.can_manage_activities = True
            self.can_view_reports = True
            self.can_manage_branches = False  # Não gerencia filiais por padrão
            
        elif self.role == RoleChoices.SECRETARY:
            # Secretário gerencia dados básicos
            self.can_access_admin = True
            self.can_manage_members = True
            self.can_manage_visitors = True
            self.can_manage_activities = False
            self.can_view_reports = True
            self.can_manage_branches = False
            
        elif self.role == RoleChoices.LEADER:
            # Líder gerencia atividades e visitantes
            self.can_access_admin = False
            self.can_manage_members = False
            self.can_manage_visitors = True
            self.can_manage_activities = True
            self.can_view_reports = False
            self.can_manage_branches = False
            
        elif self.role == RoleChoices.MEMBER:
            # Membro comum não tem permissões administrativas
            pass  # Todas as permissões já estão False
    
    def can_access_church(self, church):
        """Verifica se o usuário pode acessar uma igreja específica"""
        return self.church == church and self.is_active
    
    def can_manage_branch(self, branch):
        """
        Verifica se o usuário pode gerenciar uma filial específica.
        
        Args:
            branch: Instância de Branch
            
        Returns:
            bool: True se pode gerenciar a filial
        """
        if not self.can_manage_branches:
            return False
        
        # Se não tem filiais específicas, pode gerenciar todas da igreja
        if not self.managed_branches.exists():
            return branch.church == self.church
        
        # Senão, só pode gerenciar as filiais específicas
        return self.managed_branches.filter(id=branch.id).exists()
    
    def get_accessible_branches(self):
        """
        Retorna as filiais que o usuário pode acessar.
        
        Returns:
            QuerySet: Filiais acessíveis
        """
        if not self.can_manage_branches:
            return self.church.branches.none()
        
        if not self.managed_branches.exists():
            return self.church.branches.all()
        
        return self.managed_branches.all()
    
    def has_permission(self, permission_name):
        """Verifica se o usuário tem uma permissão específica"""
        return getattr(self, f'can_{permission_name}', False)
    
    @property
    def is_admin(self):
        """Verifica se o usuário é administrador"""
        return self.role in [
            RoleChoices.SUPER_ADMIN,
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR
        ]
    
    @property
    def is_leader(self):
        """Verifica se o usuário é líder (tem algum nível de liderança)"""
        return self.role in [
            RoleChoices.SUPER_ADMIN,
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER
        ]
    
    def get_role_color(self):
        """Retorna cor para exibição do papel"""
        colors = {
            RoleChoices.SUPER_ADMIN: '#dc3545',  # Vermelho
            RoleChoices.CHURCH_ADMIN: '#fd7e14',  # Laranja
            RoleChoices.PASTOR: '#6f42c1',  # Roxo
            RoleChoices.SECRETARY: '#20c997',  # Verde-água
            RoleChoices.LEADER: '#0dcaf0',  # Azul claro
            RoleChoices.MEMBER: '#6c757d',  # Cinza
        }
        return colors.get(self.role, '#6c757d')
