# 📋 GUIA DE IMPLEMENTAÇÃO - SISTEMA DE VISITANTES VIA QR CODE (REACT + DJANGO)

## 🎯 Objetivo
Implementar sistema completo de cadastro de visitantes via QR Code único por filial para arquitetura **React + TypeScript frontend** e **Django REST API backend**, mantendo isolamento multi-tenant entre igrejas.

## 📋 Visão Geral da Funcionalidade

- Cada filial possui QR Code único
- Visitantes escaneiam QR e são direcionados para página React específica
- Dados ficam isolados por igreja (multi-tenant)
- Sistema permite conversão de visitante para membro
- Dashboard React administrativo para acompanhamento

---

## 🚀 IMPLEMENTAÇÃO PASSO A PASSO

### **FASE 1: Backend - Preparação dos Models (1-2 dias)**

#### 1.1 - Verificar/Ajustar Model Branch

**Arquivo:** `backend/apps/branches/models.py`

```python
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from apps.core.models import BaseModel

class Branch(BaseModel):
    # ... campos existentes ...
    
    # =====================================
    # SISTEMA DE QR CODE
    # =====================================
    
    qr_code_uuid = models.UUIDField(
        "UUID do QR Code",
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text="Identificador único para o QR code"
    )
    
    qr_code_image = models.ImageField(
        "Imagem do QR Code",
        upload_to='branches/qr_codes/',
        blank=True,
        null=True,
        help_text="Imagem do QR code gerada automaticamente"
    )
    
    qr_code_active = models.BooleanField(
        "QR Code Ativo",
        default=True,
        help_text="Se o QR code está ativo para registro de visitantes"
    )
    
    visitor_registration_url = models.URLField(
        "URL de Registro",
        blank=True,
        help_text="URL completa para registro de visitantes"
    )
    
    # Estatísticas
    total_visitors_registered = models.PositiveIntegerField(
        "Total de Visitantes Registrados",
        default=0,
        help_text="Contador de visitantes registrados via QR code"
    )
    
    def generate_qr_code(self):
        """Gera QR Code para esta filial"""
        from django.conf import settings
        
        # URL do formulário React
        url = f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"
        
        # Configurações do QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Adicionar dados e otimizar
        qr.add_data(url)
        qr.make(fit=True)
        
        # Criar imagem
        img = qr.make_image(
            fill_color="black",
            back_color="white"
        )
        
        # Converter para bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Salvar no campo ImageField
        filename = f"qr_code_{self.qr_code_uuid}.png"
        self.qr_code_image.save(
            filename,
            File(buffer),
            save=True
        )
        
        # Atualizar URL de registro
        self.visitor_registration_url = url
        self.save()
    
    def get_visitor_registration_url(self):
        """Retorna URL para registro de visitantes"""
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"
```

#### 1.2 - Criar Model Visitor

**Arquivo:** `backend/apps/visitors/models.py`

```python
from django.db import models
from apps.core.models import BaseModel, TenantManager
from apps.core.validators import phone_validator, validate_cpf
from apps.core.choices import GenderChoices, MaritalStatusChoices

class VisitorManager(TenantManager):
    """Manager para visitantes com filtros por igreja"""
    
    def pending_conversion(self, church):
        """Visitantes que ainda não foram convertidos em membros"""
        return self.filter(
            church=church,
            converted_to_member=False
        )
    
    def converted(self, church):
        """Visitantes já convertidos em membros"""
        return self.filter(
            church=church,
            converted_to_member=True
        )

class Visitor(BaseModel):
    """
    Visitantes registrados via QR Code das filiais
    """
    
    # =====================================
    # RELACIONAMENTOS (MULTI-TENANT)
    # =====================================
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Igreja"
    )
    
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Filial"
    )
    
    # Membro convertido (se aplicável)
    converted_member = models.OneToOneField(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitor_origin',
        verbose_name="Membro Convertido"
    )
    
    # =====================================
    # DADOS PESSOAIS
    # =====================================
    
    full_name = models.CharField(
        "Nome Completo",
        max_length=200
    )
    
    email = models.EmailField(
        "E-mail"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator]
    )
    
    birth_date = models.DateField(
        "Data de Nascimento",
        blank=True,
        null=True
    )
    
    gender = models.CharField(
        "Gênero",
        max_length=1,
        choices=GenderChoices.choices,
        default=GenderChoices.NOT_INFORMED
    )
    
    cpf = models.CharField(
        "CPF",
        max_length=14,
        blank=True,
        validators=[validate_cpf]
    )
    
    # =====================================
    # ENDEREÇO
    # =====================================
    
    city = models.CharField(
        "Cidade",
        max_length=100
    )
    
    state = models.CharField(
        "Estado",
        max_length=2
    )
    
    neighborhood = models.CharField(
        "Bairro",
        max_length=100
    )
    
    # =====================================
    # DADOS ESPECÍFICOS DO FORMULÁRIO
    # =====================================
    
    marital_status = models.CharField(
        "Estado Civil",
        max_length=20,
        choices=MaritalStatusChoices.choices,
        default=MaritalStatusChoices.SINGLE
    )
    
    ministry_interest = models.TextField(
        "Interesse em Ministérios",
        blank=True
    )
    
    first_visit = models.BooleanField(
        "Primeira Visita",
        default=True
    )
    
    wants_prayer = models.BooleanField(
        "Quer Oração",
        default=False
    )
    
    wants_growth_group = models.BooleanField(
        "Interesse em Grupo de Crescimento",
        default=False
    )
    
    observations = models.TextField(
        "Observações",
        blank=True
    )
    
    # =====================================
    # ORIGEM E RASTREAMENTO
    # =====================================
    
    qr_code_used = models.UUIDField(
        "QR Code Utilizado"
    )
    
    registration_source = models.CharField(
        "Fonte do Cadastro",
        max_length=20,
        default='qr_code'
    )
    
    user_agent = models.TextField(
        "User Agent",
        blank=True
    )
    
    ip_address = models.GenericIPAddressField(
        "Endereço IP",
        blank=True,
        null=True
    )
    
    # =====================================
    # SISTEMA DE CONVERSÃO
    # =====================================
    
    converted_to_member = models.BooleanField(
        "Convertido para Membro",
        default=False
    )
    
    conversion_date = models.DateTimeField(
        "Data de Conversão",
        blank=True,
        null=True
    )
    
    conversion_notes = models.TextField(
        "Notas da Conversão",
        blank=True
    )
    
    # =====================================
    # ACOMPANHAMENTO
    # =====================================
    
    contact_attempts = models.PositiveIntegerField(
        "Tentativas de Contato",
        default=0
    )
    
    last_contact_date = models.DateTimeField(
        "Último Contato",
        blank=True,
        null=True
    )
    
    follow_up_status = models.CharField(
        "Status do Follow-up",
        max_length=20,
        choices=[
            ('pending', 'Pendente'),
            ('contacted', 'Contatado'),
            ('interested', 'Interessado'),
            ('not_interested', 'Não Interessado'),
            ('converted', 'Convertido'),
        ],
        default='pending'
    )
    
    # Managers
    objects = VisitorManager()
    
    class Meta:
        verbose_name = "Visitante"
        verbose_name_plural = "Visitantes"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['church', 'branch']),
            models.Index(fields=['church', 'converted_to_member']),
            models.Index(fields=['qr_code_used']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.branch.name}"
    
    @property
    def age(self):
        """Calcula idade baseada na data de nascimento"""
        if not self.birth_date:
            return None
        
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    def convert_to_member(self, notes=""):
        """Converte visitante em membro"""
        if self.converted_to_member:
            return self.converted_member
        
        from apps.members.models import Member
        from django.utils import timezone
        
        # Criar membro baseado no visitante
        member = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name=self.full_name,
            email=self.email,
            phone=self.phone,
            birth_date=self.birth_date,
            gender=self.gender,
            cpf=self.cpf,
            city=self.city,
            state=self.state,
            neighborhood=self.neighborhood,
            marital_status=self.marital_status,
            origin='visitante',
            converted_from_visitor=True
        )
        
        # Marcar conversão
        self.converted_to_member = True
        self.converted_member = member
        self.conversion_date = timezone.now()
        self.conversion_notes = notes
        self.follow_up_status = 'converted'
        self.save()
        
        return member
```

---

### **FASE 2: Backend - API Endpoints (1-2 dias)**

#### 2.1 - Serializers para API

**Arquivo:** `backend/apps/visitors/api/serializers.py`

```python
from rest_framework import serializers
from ..models import Visitor
from apps.branches.models import Branch

class VisitorCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de visitantes via formulário público"""
    
    class Meta:
        model = Visitor
        fields = [
            'full_name', 'email', 'phone', 'birth_date', 'gender', 'cpf',
            'city', 'state', 'neighborhood', 'marital_status',
            'ministry_interest', 'first_visit', 'wants_prayer',
            'wants_growth_group', 'observations'
        ]
    
    def validate_email(self, value):
        """Validar email único por igreja"""
        # Nota: A validação de igreja será feita na view
        return value

class VisitorListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de visitantes"""
    
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    age = serializers.ReadOnlyField()
    days_since_visit = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'full_name', 'email', 'phone', 'age', 'gender',
            'city', 'branch_name', 'first_visit', 'converted_to_member',
            'follow_up_status', 'created_at', 'days_since_visit'
        ]
    
    def get_days_since_visit(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        return delta.days

class VisitorDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes do visitante"""
    
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    church_name = serializers.CharField(source='church.name', read_only=True)
    converted_member_name = serializers.CharField(
        source='converted_member.full_name', 
        read_only=True
    )
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Visitor
        fields = '__all__'

class BranchQRCodeSerializer(serializers.ModelSerializer):
    """Serializer para QR codes das filiais"""
    
    qr_code_url = serializers.SerializerMethodField()
    registration_url = serializers.CharField(source='visitor_registration_url', read_only=True)
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'qr_code_uuid', 'qr_code_url', 
            'registration_url', 'qr_code_active', 'total_visitors_registered'
        ]
    
    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return obj.qr_code_image.url
        return None

class BranchInfoSerializer(serializers.ModelSerializer):
    """Serializer para informações da filial (endpoint público)"""
    
    church_name = serializers.CharField(source='church.name', read_only=True)
    church_logo = serializers.SerializerMethodField()
    
    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'church_name', 'church_logo',
            'address', 'neighborhood', 'city', 'state',
            'phone', 'email'
        ]
    
    def get_church_logo(self, obj):
        if hasattr(obj.church, 'logo') and obj.church.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.church.logo.url)
            return obj.church.logo.url
        return None
```

#### 2.2 - Views da API

**Arquivo:** `backend/apps/visitors/api/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from ..models import Visitor
from apps.branches.models import Branch
from apps.core.permissions import ChurchPermission
from .serializers import (
    VisitorCreateSerializer, 
    VisitorListSerializer, 
    VisitorDetailSerializer,
    BranchQRCodeSerializer,
    BranchInfoSerializer
)

# ====================================
# ENDPOINT PÚBLICO PARA QR CODE
# ====================================

@api_view(['GET'])
def get_branch_info(request, qr_uuid):
    """
    Endpoint público para obter informações da filial via QR Code UUID
    """
    try:
        branch = Branch.objects.select_related('church').get(
            qr_code_uuid=qr_uuid,
            qr_code_active=True,
            is_active=True
        )
    except Branch.DoesNotExist:
        return Response(
            {'error': 'QR Code inválido ou inativo'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = BranchInfoSerializer(branch, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
def register_visitor(request, qr_uuid):
    """
    Endpoint público para registro de visitantes via QR Code
    """
    try:
        branch = Branch.objects.select_related('church').get(
            qr_code_uuid=qr_uuid,
            qr_code_active=True,
            is_active=True
        )
    except Branch.DoesNotExist:
        return Response(
            {'error': 'QR Code inválido ou inativo'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = VisitorCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        # Verificar se email já existe nesta igreja
        if Visitor.objects.filter(
            church=branch.church,
            email=serializer.validated_data['email']
        ).exists():
            return Response(
                {'error': 'Este e-mail já está cadastrado como visitante nesta igreja'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar visitante
        visitor = serializer.save(
            church=branch.church,
            branch=branch,
            qr_code_used=qr_uuid,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            ip_address=get_client_ip(request)
        )
        
        # Atualizar contador da filial
        branch.total_visitors_registered += 1
        branch.save()
        
        # TODO: Enviar notificações para administradores
        
        return Response(
            {
                'message': 'Visitante cadastrado com sucesso!',
                'visitor_id': visitor.id,
                'church_name': branch.church.name,
                'branch_name': branch.name
            }, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def get_client_ip(request):
    """Obtém IP do cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# ====================================
# ENDPOINTS ADMINISTRATIVOS
# ====================================

class VisitorViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento administrativo de visitantes"""
    
    permission_classes = [IsAuthenticated, ChurchPermission]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VisitorListSerializer
        return VisitorDetailSerializer
    
    def get_queryset(self):
        """Filtra visitantes pela igreja do usuário"""
        return Visitor.objects.filter(
            church=self.request.user.church_user.church
        ).select_related('branch', 'converted_member').order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Endpoint para estatísticas de visitantes"""
        church = request.user.church_user.church
        
        # Estatísticas gerais
        total_visitors = Visitor.objects.filter(church=church).count()
        converted_visitors = Visitor.objects.filter(
            church=church, 
            converted_to_member=True
        ).count()
        pending_visitors = total_visitors - converted_visitors
        conversion_rate = (converted_visitors / total_visitors * 100) if total_visitors > 0 else 0
        
        # Visitantes este mês
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        visitors_this_month = Visitor.objects.filter(
            church=church,
            created_at__gte=start_of_month
        ).count()
        
        # Visitantes mês passado
        last_month_start = (start_of_month - relativedelta(months=1))
        last_month_end = start_of_month
        visitors_last_month = Visitor.objects.filter(
            church=church,
            created_at__gte=last_month_start,
            created_at__lt=last_month_end
        ).count()
        
        # Taxa de crescimento
        if visitors_last_month > 0:
            growth_rate = ((visitors_this_month - visitors_last_month) / visitors_last_month) * 100
        else:
            growth_rate = 100.0 if visitors_this_month > 0 else 0.0
        
        return Response({
            'total_visitors': total_visitors,
            'converted_visitors': converted_visitors,
            'pending_visitors': pending_visitors,
            'conversion_rate': round(conversion_rate, 2),
            'visitors_this_month': visitors_this_month,
            'visitors_last_month': visitors_last_month,
            'growth_rate': round(growth_rate, 2)
        })
    
    @action(detail=False, methods=['get'])
    def by_branch(self, request):
        """Visitantes agrupados por filial"""
        church = request.user.church_user.church
        
        visitors_by_branch = Visitor.objects.filter(church=church).values(
            'branch__id',
            'branch__name'
        ).annotate(
            total=Count('id'),
            converted=Count('id', filter=Q(converted_to_member=True)),
            pending=Count('id', filter=Q(converted_to_member=False))
        ).order_by('-total')
        
        return Response(list(visitors_by_branch))
    
    @action(detail=True, methods=['post'])
    def convert_to_member(self, request, pk=None):
        """Converte visitante em membro"""
        visitor = self.get_object()
        
        if visitor.converted_to_member:
            return Response(
                {'error': 'Visitante já foi convertido em membro'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('conversion_notes', '')
        
        try:
            member = visitor.convert_to_member(notes)
            return Response({
                'message': 'Visitante convertido com sucesso',
                'member_id': member.id,
                'member_name': member.full_name
            })
        except Exception as e:
            return Response(
                {'error': f'Erro ao converter visitante: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_contact(self, request, pk=None):
        """Marca tentativa de contato"""
        visitor = self.get_object()
        
        visitor.contact_attempts += 1
        visitor.last_contact_date = timezone.now()
        visitor.follow_up_status = request.data.get('status', 'contacted')
        visitor.save()
        
        return Response({'message': 'Contato registrado com sucesso'})

class BranchQRCodeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para QR codes das filiais"""
    
    serializer_class = BranchQRCodeSerializer
    permission_classes = [IsAuthenticated, ChurchPermission]
    
    def get_queryset(self):
        return Branch.objects.filter(
            church=self.request.user.church_user.church,
            is_active=True
        ).order_by('name')
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        """Regenera QR code de uma filial"""
        branch = self.get_object()
        
        try:
            branch.generate_qr_code()
            return Response({'message': 'QR code regenerado com sucesso'})
        except Exception as e:
            return Response(
                {'error': f'Erro ao regenerar QR code: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Ativa/desativa QR code"""
        branch = self.get_object()
        branch.qr_code_active = not branch.qr_code_active
        branch.save()
        
        status_text = 'ativado' if branch.qr_code_active else 'desativado'
        return Response({'message': f'QR code {status_text} com sucesso'})
```

#### 2.3 - URLs da API

**Arquivo:** `backend/apps/visitors/api/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Rotas para ViewSets
router = DefaultRouter()
router.register(r'visitors', views.VisitorViewSet, basename='visitor')
router.register(r'qr-codes', views.BranchQRCodeViewSet, basename='qr-code')

urlpatterns = [
    # Rotas administrativas
    path('', include(router.urls)),
    
    # Endpoints públicos para QR Code
    path('public/branch/<uuid:qr_uuid>/', views.get_branch_info, name='branch_info'),
    path('public/register/<uuid:qr_uuid>/', views.register_visitor, name='register_visitor'),
]
```

---

### **FASE 3: Frontend React - Configuração de Serviços (1 dia)**

#### 3.1 - Atualizar configuração da API

**Arquivo:** `frontend/src/config/api.ts` (adicionar aos endpoints existentes)

```typescript
// Adicionar aos API_ENDPOINTS existentes:

export const API_ENDPOINTS = {
  // ... endpoints existentes ...
  
  // Visitantes
  visitors: {
    list: '/visitors/',
    detail: (id: number) => `/visitors/${id}/`,
    stats: '/visitors/stats/',
    byBranch: '/visitors/by_branch/',
    convertToMember: (id: number) => `/visitors/${id}/convert_to_member/`,
    markContact: (id: number) => `/visitors/${id}/mark_contact/`,
    
    // Endpoints públicos
    public: {
      branchInfo: (qrUuid: string) => `/visitors/public/branch/${qrUuid}/`,
      register: (qrUuid: string) => `/visitors/public/register/${qrUuid}/`,
    }
  },
  
  // QR Codes das filiais
  qrCodes: {
    list: '/visitors/qr-codes/',
    detail: (id: number) => `/visitors/qr-codes/${id}/`,
    regenerate: (id: number) => `/visitors/qr-codes/${id}/regenerate_qr/`,
    toggleActive: (id: number) => `/visitors/qr-codes/${id}/toggle_active/`,
  },
} as const;
```

#### 3.2 - Serviço de Visitantes

**Arquivo:** `frontend/src/services/visitorsService.ts`

```typescript
import { api, API_ENDPOINTS } from '@/config/api';
import { AxiosError } from 'axios';

// =====================================
// TIPOS TYPESCRIPT
// =====================================

export interface VisitorFormData {
  full_name: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender: string;
  cpf?: string;
  city: string;
  state: string;
  neighborhood: string;
  marital_status: string;
  ministry_interest?: string;
  first_visit: boolean;
  wants_prayer: boolean;
  wants_growth_group: boolean;
  observations?: string;
}

export interface Visitor {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender: string;
  cpf?: string;
  city: string;
  state: string;
  neighborhood: string;
  marital_status: string;
  ministry_interest?: string;
  first_visit: boolean;
  wants_prayer: boolean;
  wants_growth_group: boolean;
  observations?: string;
  
  // Relacionamentos
  church: number;
  branch: number;
  branch_name: string;
  converted_member?: number;
  
  // Status e acompanhamento
  converted_to_member: boolean;
  conversion_date?: string;
  conversion_notes?: string;
  contact_attempts: number;
  last_contact_date?: string;
  follow_up_status: string;
  
  // Metadados
  qr_code_used: string;
  registration_source: string;
  age?: number;
  days_since_visit?: number;
  created_at: string;
  updated_at: string;
}

export interface BranchInfo {
  id: number;
  name: string;
  church_name: string;
  church_logo?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
}

export interface VisitorStats {
  total_visitors: number;
  converted_visitors: number;
  pending_visitors: number;
  conversion_rate: number;
  visitors_this_month: number;
  visitors_last_month: number;
  growth_rate: number;
}

export interface BranchQRCode {
  id: number;
  name: string;
  qr_code_uuid: string;
  qr_code_url?: string;
  registration_url: string;
  qr_code_active: boolean;
  total_visitors_registered: number;
}

export interface VisitorsByBranch {
  branch__id: number;
  branch__name: string;
  total: number;
  converted: number;
  pending: number;
}

// =====================================
// CLASSE DE ERRO
// =====================================

export class VisitorServiceError extends Error {
  constructor(
    message: string, 
    public status?: number, 
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'VisitorServiceError';
  }
}

// =====================================
// HELPERS
// =====================================

function handleApiError(error: unknown): VisitorServiceError {
  const axiosError = error as AxiosError<{
    error?: string;
    detail?: string;
    [key: string]: any;
  }>;

  if (axiosError.response) {
    const data = axiosError.response.data;
    let message = 'Erro desconhecido';
    
    if (data?.error) {
      message = data.error;
    } else if (data?.detail) {
      message = data.detail;
    } else if (typeof data === 'string') {
      message = data;
    }
    
    return new VisitorServiceError(
      message, 
      axiosError.response.status, 
      data as Record<string, string[]>
    );
  }
  
  return new VisitorServiceError('Erro de conexão com o servidor');
}

// =====================================
// SERVIÇO PRINCIPAL
// =====================================

export const visitorsService = {
  // ====================================
  // ENDPOINTS PÚBLICOS (QR CODE)
  // ====================================
  
  /**
   * Buscar informações da filial via QR Code UUID
   */
  async getBranchInfo(qrUuid: string): Promise<BranchInfo> {
    try {
      const response = await api.get(API_ENDPOINTS.visitors.public.branchInfo(qrUuid));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Registrar visitante via QR Code (endpoint público)
   */
  async registerVisitor(qrUuid: string, data: VisitorFormData): Promise<{
    message: string;
    visitor_id: number;
    church_name: string;
    branch_name: string;
  }> {
    try {
      const response = await api.post(
        API_ENDPOINTS.visitors.public.register(qrUuid), 
        data
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // ====================================
  // ENDPOINTS ADMINISTRATIVOS
  // ====================================
  
  /**
   * Listar visitantes da igreja
   */
  async getVisitors(): Promise<Visitor[]> {
    try {
      const response = await api.get(API_ENDPOINTS.visitors.list);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Buscar visitante específico
   */
  async getVisitor(id: number): Promise<Visitor> {
    try {
      const response = await api.get(API_ENDPOINTS.visitors.detail(id));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Buscar estatísticas de visitantes
   */
  async getVisitorStats(): Promise<VisitorStats> {
    try {
      const response = await api.get(API_ENDPOINTS.visitors.stats);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Buscar visitantes agrupados por filial
   */
  async getVisitorsByBranch(): Promise<VisitorsByBranch[]> {
    try {
      const response = await api.get(API_ENDPOINTS.visitors.byBranch);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Converter visitante em membro
   */
  async convertToMember(id: number, notes?: string): Promise<{
    message: string;
    member_id: number;
    member_name: string;
  }> {
    try {
      const response = await api.post(
        API_ENDPOINTS.visitors.convertToMember(id),
        { conversion_notes: notes }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Marcar tentativa de contato
   */
  async markContact(id: number, status: string = 'contacted'): Promise<{ message: string }> {
    try {
      const response = await api.post(
        API_ENDPOINTS.visitors.markContact(id),
        { status }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  // ====================================
  // QR CODES
  // ====================================
  
  /**
   * Listar QR codes das filiais
   */
  async getBranchQRCodes(): Promise<BranchQRCode[]> {
    try {
      const response = await api.get(API_ENDPOINTS.qrCodes.list);
      return response.data.results || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Regenerar QR code de uma filial
   */
  async regenerateQRCode(branchId: number): Promise<{ message: string }> {
    try {
      const response = await api.post(API_ENDPOINTS.qrCodes.regenerate(branchId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Ativar/desativar QR code
   */
  async toggleQRCodeActive(branchId: number): Promise<{ message: string }> {
    try {
      const response = await api.post(API_ENDPOINTS.qrCodes.toggleActive(branchId));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};
```

---

### **FASE 4: Frontend React - Páginas Públicas (2 dias)**

#### 4.1 - Página de Registro de Visitante

**Arquivo:** `frontend/src/pages/VisitorRegistration.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { visitorsService, BranchInfo, VisitorFormData } from '@/services/visitorsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Church, MapPin, Heart, CheckCircle } from 'lucide-react';

// =====================================
// VALIDAÇÃO COM ZOD
// =====================================

const visitorSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  birth_date: z.string().optional(),
  gender: z.string().min(1, 'Selecione um gênero'),
  cpf: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  marital_status: z.string().min(1, 'Selecione o estado civil'),
  ministry_interest: z.string().optional(),
  first_visit: z.boolean().default(true),
  wants_prayer: z.boolean().default(false),
  wants_growth_group: z.boolean().default(false),
  observations: z.string().optional(),
});

type VisitorFormSchema = z.infer<typeof visitorSchema>;

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

const VisitorRegistration: React.FC = () => {
  const { qrUuid } = useParams<{ qrUuid: string }>();
  const navigate = useNavigate();
  
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<VisitorFormSchema>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      first_visit: true,
      wants_prayer: false,
      wants_growth_group: false,
      gender: '',
      marital_status: '',
    }
  });

  // =====================================
  // EFFECTS
  // =====================================

  useEffect(() => {
    if (!qrUuid) {
      setError('QR Code inválido');
      setLoading(false);
      return;
    }

    loadBranchInfo();
  }, [qrUuid]);

  const loadBranchInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const info = await visitorsService.getBranchInfo(qrUuid!);
      setBranchInfo(info);
    } catch (err: any) {
      console.error('Erro ao carregar informações da filial:', err);
      setError(err.message || 'Erro ao carregar informações da igreja');
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // HANDLERS
  // =====================================

  const onSubmit = async (data: VisitorFormSchema) => {
    if (!qrUuid) return;

    try {
      setSubmitting(true);
      
      const result = await visitorsService.registerVisitor(qrUuid, data as VisitorFormData);
      
      toast.success('Cadastro realizado com sucesso!');
      setSuccess(true);
      
      // Redirecionar para página de sucesso após delay
      setTimeout(() => {
        navigate(`/visit/${qrUuid}/success`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erro ao cadastrar visitante:', err);
      toast.error(err.message || 'Erro ao realizar cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // RENDERS CONDICIONAIS
  // =====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando informações...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !branchInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">QR Code Inválido</h3>
            <p className="text-red-600 text-center">
              {error || 'O QR code escaneado não é válido ou não está mais ativo.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Cadastro Realizado!</h3>
            <p className="text-green-600 text-center mb-4">
              Obrigado por se cadastrar! Em breve entraremos em contato.
            </p>
            <p className="text-sm text-gray-500">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================
  // RENDER PRINCIPAL
  // =====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header da Igreja */}
        <Card className="mb-6">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            {branchInfo.church_logo && (
              <img 
                src={branchInfo.church_logo} 
                alt={branchInfo.church_name}
                className="h-16 w-16 mx-auto mb-4 rounded-full bg-white p-2"
              />
            )}
            <CardTitle className="text-2xl">{branchInfo.church_name}</CardTitle>
            <CardDescription className="text-blue-100">
              <Church className="inline h-4 w-4 mr-1" />
              {branchInfo.name}
            </CardDescription>
            <CardDescription className="text-blue-100">
              <MapPin className="inline h-4 w-4 mr-1" />
              {branchInfo.city}/{branchInfo.state}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Seja muito bem-vindo(a)! Queremos conhecer você melhor e saber como podemos te servir.
            </p>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastro de Visitante</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para que possamos entrar em contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      placeholder="Seu nome completo"
                      className={errors.full_name ? 'border-red-500' : ''}
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      {...register('birth_date')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gênero *</Label>
                    <Select onValueChange={(value) => setValue('gender', value)}>
                      <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                        <SelectItem value="N">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="marital_status">Estado Civil *</Label>
                    <Select onValueChange={(value) => setValue('marital_status', value)}>
                      <SelectTrigger className={errors.marital_status ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Solteiro(a)</SelectItem>
                        <SelectItem value="married">Casado(a)</SelectItem>
                        <SelectItem value="divorced">Divorciado(a)</SelectItem>
                        <SelectItem value="widowed">Viúvo(a)</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.marital_status && (
                      <p className="text-red-500 text-sm mt-1">{errors.marital_status.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Onde você mora?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="São Paulo"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="SP"
                      maxLength={2}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      {...register('neighborhood')}
                      placeholder="Centro"
                      className={errors.neighborhood ? 'border-red-500' : ''}
                    />
                    {errors.neighborhood && (
                      <p className="text-red-500 text-sm mt-1">{errors.neighborhood.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Interesses */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-blue-600" />
                  Como podemos te servir?
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ministry_interest">Interesse em Ministérios</Label>
                    <Textarea
                      id="ministry_interest"
                      {...register('ministry_interest')}
                      placeholder="Conte-nos sobre seus interesses ministeriais..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="first_visit"
                        {...register('first_visit')}
                        defaultChecked={true}
                      />
                      <Label htmlFor="first_visit">Esta é sua primeira visita à nossa igreja?</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wants_prayer"
                        {...register('wants_prayer')}
                      />
                      <Label htmlFor="wants_prayer">Gostaria de atendimento pastoral/oração?</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <Checkbox
                        id="wants_growth_group"
                        {...register('wants_growth_group')}
                      />
                      <Label htmlFor="wants_growth_group">Tem interesse em participar de grupos pequenos?</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      {...register('observations')}
                      placeholder="Alguma observação ou como podemos te ajudar?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Botão de envio */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando cadastro...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Enviar Cadastro
                    </>
                  )}
                </Button>
              </div>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Seus dados estão seguros e protegidos conosco.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorRegistration;
```

#### 4.2 - Página de Sucesso

**Arquivo:** `frontend/src/pages/VisitorSuccess.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { visitorsService, BranchInfo } from '@/services/visitorsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Church, MapPin, Phone, Calendar, Clock, Globe, Instagram, Loader2 } from 'lucide-react';

const VisitorSuccess: React.FC = () => {
  const { qrUuid } = useParams<{ qrUuid: string }>();
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (qrUuid) {
      loadBranchInfo();
    }
  }, [qrUuid]);

  const loadBranchInfo = async () => {
    try {
      setLoading(true);
      const info = await visitorsService.getBranchInfo(qrUuid!);
      setBranchInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Confirmação de Sucesso */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-green-800 mb-2">Cadastro realizado com sucesso!</h1>
            <p className="text-green-600 text-center mb-6">
              Obrigado por se cadastrar! Em breve entraremos em contato para te conhecer melhor.
            </p>
            
            {branchInfo && (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{branchInfo.church_name}</h2>
                <p className="text-gray-600">{branchInfo.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Igreja */}
        {branchInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Próximos Cultos</h3>
                <div className="text-center text-sm text-gray-600">
                  <p>Domingo às 19h</p>
                  <p>Quarta às 20h</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <MapPin className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Nossa Localização</h3>
                <div className="text-center text-sm text-gray-600">
                  <p>{branchInfo.neighborhood}</p>
                  <p>{branchInfo.city}/{branchInfo.state}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Phone className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Contato</h3>
                <div className="text-center text-sm text-gray-600">
                  {branchInfo.phone && (
                    <p>{branchInfo.phone}</p>
                  )}
                  {branchInfo.email && (
                    <p>{branchInfo.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Próximos passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <p className="text-gray-700">Você receberá uma mensagem de confirmação</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <p className="text-gray-700">Um de nossos líderes entrará em contato</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <p className="text-gray-700">Convidamos você para nossos próximos encontros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais e Links */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="font-semibold mb-4">Fique conectado conosco</h3>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                Nosso Site
              </Button>
              <Button variant="outline" size="sm">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorSuccess;