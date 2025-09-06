from rest_framework import serializers
from apps.accounts.models import CustomUser
from apps.churches.models import Church
from .models import PrayerRequest, PrayerMessage, PrayerResponse


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer para dados básicos do autor"""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email']
        read_only_fields = ['id', 'email']


class ChurchSerializer(serializers.ModelSerializer):
    """Serializer para dados básicos da igreja"""
    
    class Meta:
        model = Church
        fields = ['id', 'name', 'address', 'phone']
        read_only_fields = ['id', 'name', 'address', 'phone']


class PrayerMessageSerializer(serializers.ModelSerializer):
    """Serializer para mensagens de apoio/oração"""
    author = AuthorSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PrayerMessage
        fields = [
            'id', 'uuid', 'content', 'is_anonymous', 
            'created_at', 'updated_at', 'author', 'author_name'
        ]
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at', 'author']
    
    def get_author_name(self, obj):
        """Retorna nome do autor ou 'Anônimo' se for mensagem anônima"""
        if obj.is_anonymous:
            return "Anônimo"
        return obj.author.get_full_name() if obj.author else "Usuário"
    
    def create(self, validated_data):
        """Cria uma nova mensagem de apoio"""
        # A view (perform_create) já define o autor e prayer_request
        return super().create(validated_data)


class PrayerResponseSerializer(serializers.ModelSerializer):
    """Serializer para respostas de oração (estou orando)"""
    user = AuthorSerializer(read_only=True)
    
    class Meta:
        model = PrayerResponse
        fields = [
            'id', 'uuid', 'is_praying', 'created_at', 
            'updated_at', 'user'
        ]
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at', 'user']
    
    def create(self, validated_data):
        """Cria ou atualiza uma resposta de oração"""
        request = self.context['request']
        prayer_request = self.context['prayer_request']
        
        # Verifica se já existe uma resposta deste usuário para este pedido
        existing_response = PrayerResponse.objects.filter(
            prayer_request=prayer_request,
            user=request.user
        ).first()
        
        if existing_response:
            # Atualiza a resposta existente
            existing_response.is_praying = validated_data.get('is_praying', existing_response.is_praying)
            existing_response.save()
            return existing_response
        
        # Cria nova resposta
        validated_data['user'] = request.user
        validated_data['prayer_request'] = prayer_request
        
        return super().create(validated_data)


class PrayerRequestSerializer(serializers.ModelSerializer):
    """Serializer principal para pedidos de oração"""
    author = AuthorSerializer(read_only=True)
    church = ChurchSerializer(read_only=True)
    prayer_messages = PrayerMessageSerializer(many=True, read_only=True)
    prayer_responses = PrayerResponseSerializer(many=True, read_only=True)
    
    # Campos calculados
    author_name = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    prayers_count = serializers.SerializerMethodField()
    is_praying = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = PrayerRequest
        fields = [
            'id', 'uuid', 'title', 'content', 'category', 'status',
            'is_anonymous', 'allow_visit', 'allow_contact', 'publish_on_wall',
            'image', 'answered_at', 'answer_testimony', 'created_at', 'updated_at',
            'author', 'church', 'author_name', 'prayer_messages', 'prayer_responses',
            'messages_count', 'prayers_count', 'is_praying', 'can_edit'
        ]
        read_only_fields = [
            'id', 'uuid', 'created_at', 'updated_at', 'author', 'church',
            'answered_at'
        ]
    
    def get_author_name(self, obj):
        """Retorna nome do autor ou 'Anônimo' se for pedido anônimo"""
        if obj.is_anonymous:
            return "Anônimo"
        return obj.author.get_full_name() if obj.author else "Usuário"
    
    def get_messages_count(self, obj):
        """Retorna quantidade de mensagens de apoio"""
        return obj.prayer_messages.filter(is_active=True).count()
    
    def get_prayers_count(self, obj):
        """Retorna quantidade de pessoas orando"""
        return obj.prayer_responses.filter(is_praying=True, is_active=True).count()
    
    def get_is_praying(self, obj):
        """Verifica se o usuário atual está orando por este pedido"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return obj.prayer_responses.filter(
            user=request.user,
            is_praying=True,
            is_active=True
        ).exists()
    
    def get_can_edit(self, obj):
        """Verifica se o usuário atual pode editar este pedido"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Autor pode editar
        if obj.author == request.user:
            return True
        
        # Administradores e pastores podem editar
        user_role = getattr(request.user, 'role', None)
        if user_role in ['admin', 'pastor']:
            return True
        
        return False
    
    def create(self, validated_data):
        """Cria um novo pedido de oração"""
        # A view (perform_create) já define o autor e church
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Atualiza um pedido de oração existente"""
        # Se o status mudou para 'answered', define answered_at
        if (validated_data.get('status') == 'answered' and 
            instance.status != 'answered'):
            from django.utils import timezone
            validated_data['answered_at'] = timezone.now()
        
        # Se mudou de 'answered' para outro status, remove answered_at
        elif (instance.status == 'answered' and 
              validated_data.get('status') != 'answered'):
            validated_data['answered_at'] = None
            validated_data['answer_testimony'] = ''
        
        return super().update(instance, validated_data)
    
    def validate(self, data):
        """Validações customizadas"""
        # Se status é 'answered', answer_testimony é obrigatório
        if data.get('status') == 'answered' and not data.get('answer_testimony'):
            raise serializers.ValidationError({
                'answer_testimony': 'Testemunho da resposta é obrigatório quando o status é "Respondido"'
            })
        
        return data


class PrayerRequestListSerializer(PrayerRequestSerializer):
    """Serializer otimizado para listagem de pedidos (sem incluir mensagens)"""
    
    class Meta(PrayerRequestSerializer.Meta):
        fields = [
            'id', 'uuid', 'title', 'content', 'category', 'status',
            'is_anonymous', 'allow_visit', 'allow_contact', 'publish_on_wall',
            'image', 'answered_at', 'created_at', 'updated_at',
            'author', 'church', 'author_name',
            'messages_count', 'prayers_count', 'is_praying', 'can_edit'
        ]


class PrayerRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer otimizado para criação de pedidos"""
    
    class Meta:
        model = PrayerRequest
        fields = [
            'title', 'content', 'category', 'is_anonymous',
            'allow_visit', 'allow_contact', 'publish_on_wall', 'image'
        ]
    
    def create(self, validated_data):
        """Cria um novo pedido de oração"""
        request = self.context['request']
        
        # Define autor e igreja
        validated_data['author'] = request.user
        validated_data['church'] = request.user.church
        validated_data['status'] = 'active'  # Status padrão
        
        return super().create(validated_data)
