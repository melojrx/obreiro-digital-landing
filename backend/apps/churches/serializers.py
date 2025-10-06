"""
Serializers para o app Churches
Gerencia serialização de igrejas
"""

from rest_framework import serializers
from django.db import models
from django.db import transaction
from .models import Church


class ChurchSerializer(serializers.ModelSerializer):
    """Serializer para Church"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    main_pastor_name = serializers.CharField(source='main_pastor.get_full_name', read_only=True)
    display_name = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    is_subscription_active = serializers.ReadOnlyField()
    is_trial_active = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    subscription_expired = serializers.ReadOnlyField()
    can_add_members = serializers.ReadOnlyField()
    can_add_branches = serializers.ReadOnlyField()
    
    class Meta:
        model = Church
        fields = [
            'id', 'denomination', 'denomination_name', 'name', 'short_name',
            'description', 'email', 'phone', 'website', 'address', 'city',
            'state', 'zipcode', 'cnpj', 'main_pastor', 'main_pastor_name',
            'logo', 'cover_image', 'subscription_plan', 'subscription_status',
            'subscription_start_date', 'subscription_end_date', 'trial_end_date',
            'max_members', 'max_branches', 'total_members', 'total_visitors',
            'display_name', 'full_address', 'is_subscription_active',
            'is_trial_active', 'days_until_expiration', 'subscription_expired',
            'can_add_members', 'can_add_branches', 'created_at', 'updated_at',
            'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'denomination_name',
            'main_pastor_name', 'display_name', 'full_address',
            'is_subscription_active', 'is_trial_active', 'days_until_expiration',
            'subscription_expired', 'can_add_members', 'can_add_branches',
            'total_members', 'total_visitors'
        ]


class ChurchCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de Church"""
    
    class Meta:
        model = Church
        fields = [
            'denomination', 'name', 'short_name', 'description', 'email',
            'phone', 'website', 'address', 'city', 'state', 'zipcode',
            'cnpj', 'main_pastor', 'logo', 'cover_image', 'subscription_plan'
        ]
    
    def validate_main_pastor(self, value):
        """Validar se o usuário pode ser pastor principal"""
        if value:
            from apps.accounts.models import RoleChoices
            
            # Verificar se o usuário tem papel adequado para ser pastor
            user_roles = value.church_users.filter(is_active=True).values_list('role', flat=True)
            
            # Permitir apenas usuários com papéis de liderança ou sem papel ainda
            allowed_roles = [
                RoleChoices.CHURCH_ADMIN,
                RoleChoices.PASTOR,
                RoleChoices.SECRETARY
            ]
            
            # Se já tem papéis, verificar se são compatíveis
            if user_roles and not any(role in allowed_roles for role in user_roles):
                raise serializers.ValidationError(
                    "Este usuário não tem permissão para ser pastor principal"
                )
        
        return value
    
    def validate_email(self, value):
        """Validar email único por denominação"""
        denomination = self.initial_data.get('denomination')
        
        if denomination:
            existing_church = Church.objects.filter(
                denomination_id=denomination,
                email=value,
                is_active=True
            ).first()
            
            if existing_church:
                raise serializers.ValidationError(
                    "Já existe uma igreja com este email nesta denominação"
                )
        
        return value
    
    def validate_cnpj(self, value):
        """Validar CNPJ único"""
        if value:
            existing_church = Church.objects.filter(
                cnpj=value,
                is_active=True
            ).first()
            
            if existing_church:
                raise serializers.ValidationError("Já existe uma igreja com este CNPJ")
        
        return value
    
    def validate(self, attrs):
        """Validações gerais"""
        denomination = attrs.get('denomination')
        
        # Verificar limites de igrejas por denominação
        if denomination:
            from apps.core.models import SubscriptionPlanChoices
            
            # Buscar plano da denominação ou usar padrão
            denomination_plan = getattr(denomination, 'subscription_plan', SubscriptionPlanChoices.BASIC)
            
            # Limites por plano (para denominações)
            limits = {
                SubscriptionPlanChoices.BASIC: 1,
                SubscriptionPlanChoices.PROFESSIONAL: 5,
                SubscriptionPlanChoices.ENTERPRISE: 20,
                SubscriptionPlanChoices.DENOMINATION: 999999,  # Ilimitado
            }
            
            max_churches = limits.get(denomination_plan, 1)
            current_churches = Church.objects.filter(
                denomination=denomination,
                is_active=True
            ).count()
            
            if current_churches >= max_churches:
                raise serializers.ValidationError(
                    f"Esta denominação atingiu o limite de {max_churches} igrejas para o plano {denomination_plan}"
                )
        
        # Validar estado (formato)
        state = attrs.get('state')
        if state and len(state) != 2:
            raise serializers.ValidationError({
                'state': 'Estado deve ter exatamente 2 caracteres (ex: SP, RJ)'
            })
        
        return attrs
    
    def create(self, validated_data):
        """
        Cria a igreja e automaticamente vincula o usuário criador como CHURCH_ADMIN
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Obter usuário da requisição
        user = self.context['request'].user
        
        # Criar a igreja
        church = super().create(validated_data)
        logger.info(f"✅ Igreja '{church.name}' criada (ID: {church.id})")
        
        # Criar ChurchUser vinculando o usuário criador como CHURCH_ADMIN
        from apps.accounts.models import ChurchUser, RoleChoices
        
        # Verificar se já existe ChurchUser para este usuário e igreja
        church_user, created = ChurchUser.objects.get_or_create(
            user=user,
            church=church,
            defaults={
                'role': RoleChoices.CHURCH_ADMIN,
                'is_active': True,
                'can_access_admin': True,
                'can_manage_members': True,
                'can_manage_visitors': True,
                'can_manage_activities': True,
                'can_view_reports': True,
                'can_manage_branches': True,
            }
        )
        
        if created:
            logger.info(f"✅ ChurchUser criado: {user.email} como CHURCH_ADMIN da igreja '{church.name}'")
        else:
            logger.info(f"⚠️ ChurchUser já existia: {user.email} na igreja '{church.name}'")
        
        # Criar filial matriz automaticamente com QR Code
        try:
            from apps.branches.models import Branch
            
            main_branch = Branch.objects.create(
                church=church,
                name=f"{church.name} - Matriz",
                short_name=church.short_name or "Matriz",
                address=church.address,
                city=church.city,
                state=church.state,
                zipcode=church.zipcode,
                phone=church.phone,
                email=church.email,
                qr_code_active=True,
                is_active=True
            )
            logger.info(f"✅ Filial matriz criada com QR Code para igreja '{church.name}'")
            logger.info(f"   QR Code UUID: {main_branch.qr_code_uuid}")
            
        except Exception as branch_error:
            logger.warning(f"⚠️ Erro ao criar filial matriz: {str(branch_error)}")
        
        return church


class ChurchSummarySerializer(serializers.ModelSerializer):
    """Serializer resumido para listagens"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    display_name = serializers.ReadOnlyField()
    subscription_status_display = serializers.CharField(source='get_subscription_status_display', read_only=True)
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'display_name', 'city', 'state', 'denomination_name',
            'subscription_plan', 'subscription_status', 'subscription_status_display',
            'total_members', 'is_active'
        ]


class ChurchStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da igreja"""
    
    plan_features = serializers.SerializerMethodField()
    subscription_limits = serializers.SerializerMethodField()
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'subscription_plan', 'subscription_status',
            'max_members', 'max_branches', 'total_members', 'total_visitors',
            'plan_features', 'subscription_limits'
        ]
    
    def get_plan_features(self, obj):
        return obj.get_plan_features()
    
    def get_subscription_limits(self, obj):
        return obj.check_subscription_limits()


class ChurchSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para gerenciar assinatura"""
    
    class Meta:
        model = Church
        fields = [
            'subscription_plan', 'subscription_status', 'subscription_end_date',
            'trial_end_date', 'max_members', 'max_branches'
        ]
    
    def update(self, instance, validated_data):
        # Atualizar limites baseado no plano
        instance = super().update(instance, validated_data)
        instance.set_plan_limits()
        return instance


class ChurchListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagens com paginação"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    display_name = serializers.ReadOnlyField()
    subscription_status_display = serializers.CharField(source='get_subscription_status_display', read_only=True)
    subscription_plan_display = serializers.CharField(source='get_subscription_plan_display', read_only=True)
    main_pastor_name = serializers.CharField(source='main_pastor.get_full_name', read_only=True)
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'display_name', 'short_name', 'city', 'state', 
            'denomination', 'denomination_name', 'subscription_plan', 
            'subscription_plan_display', 'subscription_status', 
            'subscription_status_display', 'total_members', 'total_visitors',
            'main_pastor_name', 'phone', 'email', 'is_active', 'created_at'
        ]


class ChurchUpdateSerializer(serializers.ModelSerializer):
    """Serializer específico para atualizações"""
    
    class Meta:
        model = Church
        fields = [
            'name', 'short_name', 'description', 'email', 'phone', 'website',
            'address', 'city', 'state', 'zipcode', 'main_pastor', 'logo',
            'cover_image'
        ]
    
    def validate_main_pastor(self, value):
        """Validar se o usuário pode ser pastor principal"""
        if value:
            from apps.accounts.models import RoleChoices
            
            # Verificar se o usuário tem papel adequado para ser pastor
            user_roles = value.church_users.filter(is_active=True).values_list('role', flat=True)
            
            # Permitir apenas usuários com papéis de liderança ou sem papel ainda
            allowed_roles = [
                RoleChoices.CHURCH_ADMIN,
                RoleChoices.PASTOR,
                RoleChoices.SECRETARY
            ]
            
            # Se já tem papéis, verificar se são compatíveis
            if user_roles and not any(role in allowed_roles for role in user_roles):
                raise serializers.ValidationError(
                    "Este usuário não tem permissão para ser pastor principal"
                )
        
        return value
    
    def validate_email(self, value):
        """Validar email único por denominação"""
        instance = self.instance
        denomination = instance.denomination if instance else None
        
        if denomination:
            existing_church = Church.objects.filter(
                denomination=denomination,
                email=value,
                is_active=True
            ).exclude(pk=instance.pk if instance else None).first()
            
            if existing_church:
                raise serializers.ValidationError(
                    f"Já existe uma igreja com este email na denominação {denomination.name}"
                )
        
        return value
    
    def validate_cnpj(self, value):
        """Validar CNPJ único"""
        if value:
            instance = self.instance
            existing_church = Church.objects.filter(
                cnpj=value,
                is_active=True
            ).exclude(pk=instance.pk if instance else None).first()
            
            if existing_church:
                raise serializers.ValidationError("Já existe uma igreja com este CNPJ")
        
        return value


class ChurchStatisticsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas detalhadas da igreja"""
    
    plan_features = serializers.SerializerMethodField()
    subscription_limits = serializers.SerializerMethodField()
    branches_count = serializers.SerializerMethodField()
    members_by_age_group = serializers.SerializerMethodField()
    visitors_by_month = serializers.SerializerMethodField()
    subscription_health = serializers.SerializerMethodField()
    
    class Meta:
        model = Church
        fields = [
            'id', 'name', 'subscription_plan', 'subscription_status',
            'max_members', 'max_branches', 'total_members', 'total_visitors',
            'plan_features', 'subscription_limits', 'branches_count',
            'members_by_age_group', 'visitors_by_month', 'subscription_health',
            'days_until_expiration', 'can_add_members', 'can_add_branches'
        ]
    
    def get_plan_features(self, obj):
        return obj.get_plan_features()
    
    def get_subscription_limits(self, obj):
        return obj.check_subscription_limits()
    
    def get_branches_count(self, obj):
        """Retorna contagem de filiais ativas"""
        return obj.branches.filter(is_active=True).count() if hasattr(obj, 'branches') else 0
    
    def get_members_by_age_group(self, obj):
        """Estatísticas de membros por faixa etária"""
        try:
            from apps.members.models import Member
            from django.utils import timezone
            from datetime import date
            
            members = Member.objects.filter(church=obj, is_active=True)
            
            age_groups = {
                '0-12': 0,
                '13-17': 0,
                '18-30': 0,
                '31-50': 0,
                '51-65': 0,
                '65+': 0
            }
            
            today = date.today()
            
            for member in members:
                if member.birth_date:
                    age = today.year - member.birth_date.year
                    if today.month < member.birth_date.month or (
                        today.month == member.birth_date.month and today.day < member.birth_date.day
                    ):
                        age -= 1
                    
                    if age <= 12:
                        age_groups['0-12'] += 1
                    elif age <= 17:
                        age_groups['13-17'] += 1
                    elif age <= 30:
                        age_groups['18-30'] += 1
                    elif age <= 50:
                        age_groups['31-50'] += 1
                    elif age <= 65:
                        age_groups['51-65'] += 1
                    else:
                        age_groups['65+'] += 1
            
            return age_groups
        except:
            return {'0-12': 0, '13-17': 0, '18-30': 0, '31-50': 0, '51-65': 0, '65+': 0}
    
    def get_visitors_by_month(self, obj):
        """Visitantes por mês nos últimos 6 meses"""
        try:
            from apps.visitors.models import Visitor
            from django.utils import timezone
            from datetime import datetime, timedelta
            import calendar
            
            visitors_data = []
            today = timezone.now().date()
            
            for i in range(6):
                month_start = today.replace(day=1) - timedelta(days=i*30)
                month_start = month_start.replace(day=1)
                next_month = month_start.replace(day=28) + timedelta(days=4)
                month_end = next_month - timedelta(days=next_month.day)
                
                count = Visitor.objects.filter(
                    church=obj,
                    first_visit_date__gte=month_start,
                    first_visit_date__lte=month_end
                ).count()
                
                visitors_data.append({
                    'month': calendar.month_name[month_start.month],
                    'year': month_start.year,
                    'count': count
                })
            
            return list(reversed(visitors_data))
        except:
            return []
    
    def get_subscription_health(self, obj):
        """Indicadores de saúde da assinatura"""
        return {
            'is_active': obj.is_subscription_active,
            'is_trial': obj.is_trial_active,
            'days_until_expiration': obj.days_until_expiration,
            'subscription_expired': obj.subscription_expired,
            'members_usage_percentage': (obj.total_members / obj.max_members * 100) if obj.max_members > 0 else 0,
            'branches_usage_percentage': (self.get_branches_count(obj) / obj.max_branches * 100) if obj.max_branches > 0 else 0
        }


class ChurchDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para visualização individual"""
    
    denomination_name = serializers.CharField(source='denomination.name', read_only=True)
    denomination_id = serializers.IntegerField(source='denomination.id', read_only=True)
    main_pastor_name = serializers.CharField(source='main_pastor.get_full_name', read_only=True)
    main_pastor_email = serializers.CharField(source='main_pastor.email', read_only=True)
    display_name = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    is_subscription_active = serializers.ReadOnlyField()
    is_trial_active = serializers.ReadOnlyField()
    days_until_expiration = serializers.ReadOnlyField()
    subscription_expired = serializers.ReadOnlyField()
    can_add_members = serializers.ReadOnlyField()
    can_add_branches = serializers.ReadOnlyField()
    subscription_status_display = serializers.CharField(source='get_subscription_status_display', read_only=True)
    subscription_plan_display = serializers.CharField(source='get_subscription_plan_display', read_only=True)
    
    class Meta:
        model = Church
        fields = [
            'id', 'denomination', 'denomination_id', 'denomination_name', 
            'name', 'short_name', 'description', 'email', 'phone', 'website', 
            'address', 'city', 'state', 'zipcode', 'cnpj', 'main_pastor', 
            'main_pastor_name', 'main_pastor_email', 'logo', 'cover_image', 
            'subscription_plan', 'subscription_plan_display', 'subscription_status',
            'subscription_status_display', 'subscription_start_date', 
            'subscription_end_date', 'trial_end_date', 'max_members', 'max_branches', 
            'total_members', 'total_visitors', 'display_name', 'full_address', 
            'is_subscription_active', 'is_trial_active', 'days_until_expiration', 
            'subscription_expired', 'can_add_members', 'can_add_branches', 
            'created_at', 'updated_at', 'is_active'
        ]


class FirstChurchSerializer(serializers.Serializer):
    """Serializer para criação da primeira igreja de um usuário CHURCH_ADMIN"""
    
    name = serializers.CharField(max_length=200, help_text="Nome completo da igreja")
    short_name = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True,
        help_text="Nome abreviado (opcional)"
    )
    cnpj = serializers.CharField(
        max_length=18, 
        required=False, 
        allow_blank=True,
        help_text="CNPJ da igreja (opcional)"
    )
    email = serializers.EmailField(help_text="Email da igreja")
    phone = serializers.CharField(max_length=20, help_text="Telefone da igreja")
    
    # Denominação (opcional - usa do perfil se não fornecida)
    denomination_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID da denominação (opcional - usa intended_denomination do perfil se não fornecido)"
    )
    
    # Endereço
    zipcode = serializers.CharField(max_length=9, help_text="CEP")
    address = serializers.CharField(max_length=255, help_text="Endereço completo")
    number = serializers.CharField(max_length=10, required=False, allow_blank=True, help_text="Número")
    complement = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True,
        help_text="Complemento (opcional)"
    )
    neighborhood = serializers.CharField(max_length=100, help_text="Bairro")
    city = serializers.CharField(max_length=100, help_text="Cidade")
    state = serializers.CharField(max_length=2, help_text="Estado (UF)")
    
    def validate(self, data):
        """Validações customizadas"""
        # Verificar se o usuário já tem igreja
        request = self.context.get('request')
        if request and request.user:
            from apps.accounts.models import ChurchUser
            existing_churches = ChurchUser.objects.filter(
                user=request.user,
                role='CHURCH_ADMIN',
                is_active=True
            ).exists()
            
            if existing_churches:
                raise serializers.ValidationError(
                    "Você já possui uma igreja cadastrada. Use o menu 'Igrejas' para gerenciar."
                )
        
        return data
    
    def create(self, validated_data):
        """Cria a primeira igreja e vincula o usuário como CHURCH_ADMIN"""
        request = self.context.get('request')
        user = request.user
        
        # Buscar denominação: primeiro do payload, depois do perfil
        denomination = None
        denomination_id = validated_data.get('denomination_id')
        
        if denomination_id:
            # Denominação fornecida no payload
            from apps.denominations.models import Denomination
            try:
                denomination = Denomination.objects.get(id=denomination_id)
            except Denomination.DoesNotExist:
                raise serializers.ValidationError({
                    'denomination_id': 'Denominação não encontrada.'
                })
        elif hasattr(user, 'profile') and user.profile.intended_denomination:
            # Usar denominação pretendida do perfil
            denomination = user.profile.intended_denomination
        
        if not denomination:
            raise serializers.ValidationError({
                'denomination': 'É necessário fornecer uma denominação ou ter uma denominação cadastrada no perfil.'
            })
        
        with transaction.atomic():
            # Criar endereço completo
            address_parts = [validated_data.get('address', '')]
            if validated_data.get('number'):
                address_parts.append(f"nº {validated_data['number']}")
            if validated_data.get('complement'):
                address_parts.append(validated_data['complement'])
            
            full_address = ', '.join(filter(None, address_parts))
            
            # Criar igreja com a denominação obtida
            church = Church.objects.create(
                denomination=denomination,
                name=validated_data['name'],
                short_name=validated_data.get('short_name') or validated_data['name'][:50],
                email=validated_data['email'],
                phone=validated_data['phone'],
                cnpj=validated_data.get('cnpj', ''),
                address=full_address,
                city=validated_data['city'],
                state=validated_data['state'],
                zipcode=validated_data['zipcode'],
                main_pastor=user,
                subscription_plan=user.subscription_plan or 'basic',
                subscription_status='trial',
                is_active=True
            )
            
            # Criar vínculo ChurchUser com papel CHURCH_ADMIN
            from apps.accounts.models import ChurchUser
            from apps.core.models import RoleChoices
            
            ChurchUser.objects.create(
                user=user,
                church=church,
                role=RoleChoices.CHURCH_ADMIN,  # Usar constante do enum
                is_active=True,
                is_user_active_church=True  # Definir como igreja ativa
            )
            
            # Limpar papel pretendido do perfil (já foi usado)
            if hasattr(user, 'profile'):
                user.profile.intended_role = None
                user.profile.save(update_fields=['intended_role'])
            
            return church 