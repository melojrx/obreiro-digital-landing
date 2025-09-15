🔍 IMPRESSÕES COMO DEV SENIOR - Sistema de Status de Membresia

  ✅ ANÁLISE DO DOCUMENTO:

  Pontos Fortes:
  1. Estratégia de migração inteligente - A abordagem "dual structure" é excelente - permite evolução sem
  quebrar o sistema existente
  2. Separação conceitual clara - Distingue bem papéis de sistema (permissões) vs funções ministeriais (igreja)
  3. Auditoria robusta - Histórico completo com who/when/why
  4. Performance considerada - Indexes, prefetch, otimizações bem pensadas
  5. UX bem estruturada - Timeline visual, componentes reativos

  Pontos de Atenção:
  1. Complexidade adicional - Mais tabelas, relacionamentos e lógica de negócio
  2. Duplicação temporária - Durante migração haverá informação em dois lugares
  3. Risco de confusão conceitual - Users podem confundir papéis vs funções

  🎯 AVALIAÇÃO:

  Documento muito bem estruturado e proposta sólida. O sistema atual já tem fundação excelente, essa é uma
  evolução natural e bem planejada.

  ---
  📋 PLANO DE IMPLEMENTAÇÃO - ABORDAGEM SENIOR

  FASE 1: BACKEND - FUNDAÇÃO SÓLIDA

  Tempo: ~3-4 dias

  1.1 - Novo Modelo (sem breaking changes)

  # backend/apps/members/models.py - ADICIONAR
  class MembershipStatus(BaseModel):
      """Histórico temporal de funções ministeriais"""
      member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='status_history')
      status = models.CharField(max_length=100, choices=MinisterialFunctionChoices.choices)
      effective_date = models.DateField("Data de Início")
      end_date = models.DateField("Data de Fim", null=True, blank=True)
      reason = models.TextField("Motivo", blank=True)
      changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
      is_current = models.BooleanField(default=False)

      class Meta:
          constraints = [
              models.UniqueConstraint(
                  fields=['member'], condition=models.Q(is_current=True),
                  name='unique_current_status_per_member'
              )
          ]

  1.2 - Migration Script Inteligente

  # Criar migration que MANTÉM dados existentes
  def forwards_func(apps, schema_editor):
      Member = apps.get_model("members", "Member")
      MembershipStatus = apps.get_model("members", "MembershipStatus")

      # Migrar dados existentes automaticamente
      for member in Member.objects.all():
          if member.ministerial_function:
              MembershipStatus.objects.create(
                  member=member,
                  status=member.ministerial_function,
                  effective_date=member.membership_date or member.created_at.date(),
                  is_current=True,
                  reason="Migração automática do sistema legado"
              )

  1.3 - API Endpoints Mínimos

  # backend/apps/members/views.py - ADICIONAR
  class MembershipStatusViewSet(viewsets.ModelViewSet):
      serializer_class = MembershipStatusSerializer
      permission_classes = [IsChurchAdminOrCanManageMembers]

      def get_queryset(self):
          return MembershipStatus.objects.filter(member__church=self.request.church)

  FASE 2: FRONTEND - COMPONENTES ESSENCIAIS

  Tempo: ~4-5 dias

  2.1 - Service Layer (API Interface)

  // frontend/src/services/membershipStatusService.ts - CRIAR
  export const membershipStatusService = {
    getByMember: (memberId: number) => api.get(`/members/${memberId}/status-history/`),
    create: (data: CreateMembershipStatusData) => api.post('/membership-status/', data),
    update: (id: number, data: UpdateMembershipStatusData) => api.patch(`/membership-status/${id}/`, data),
    delete: (id: number) => api.delete(`/membership-status/${id}/`),
  };

  2.2 - Componente Timeline Simples

  // frontend/src/components/members/MembershipStatusTimeline.tsx - CRIAR
  export const MembershipStatusTimeline = ({ memberId }: Props) => {
    const { data: statuses, isLoading } = useQuery(['membershipStatus', memberId],
      () => membershipStatusService.getByMember(memberId)
    );

    return (
      <div className="space-y-4">
        {statuses?.map(status => (
          <TimelineItem key={status.id} status={status} />
        ))}
      </div>
    );
  };

  2.3 - Modal de Edição Básico

  // frontend/src/components/members/StatusModal.tsx - CRIAR  
  export const StatusModal = ({ isOpen, onClose, memberId, status }: Props) => {
    const form = useForm<StatusFormData>({ resolver: zodResolver(statusSchema) });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* Formulário simples: status, data, motivo */}
      </Dialog>
    );
  };

  FASE 3: INTEGRAÇÃO DUAL (Zero Breaking Changes)

  Tempo: ~2-3 dias

  3.1 - Atualizar Componentes Existentes

  // frontend/src/components/members/MembersTable.tsx - MODIFICAR
  const getCurrentFunction = (member: Member) => {
    // ESTRATÉGIA DUAL: Preferir novo, fallback para antigo
    return member.current_status?.status_display
      || member.ministerial_function
      || 'Membro';
  };

  3.2 - Adicionar Aba no MemberDetails

  // frontend/src/components/members/MemberDetails.tsx - MODIFICAR
  <Tabs>
    {/* Abas existentes */}
    <TabsList>
      <TabsTrigger value="ministerial">Histórico Ministerial</TabsTrigger>
    </TabsList>

    <TabsContent value="ministerial">
      <MembershipStatusTimeline memberId={member.id} />
    </TabsContent>
  </Tabs>

  FASE 4: VALIDAÇÃO E REFINAMENTO

  Tempo: ~2-3 dias

  4.1 - Testes de Integração

  - ✅ Criar membro com função inicial → deve criar status
  - ✅ Visualizar timeline → deve mostrar histórico
  - ✅ Editar status → deve manter auditoria
  - ✅ Verificar compatibilidade → campos antigos ainda funcionam

  4.2 - Validações de Negócio

  # backend/apps/members/models.py - MembershipStatus
  def save(self, *args, **kwargs):
      if self.is_current:
          # Finalizar status anterior automaticamente
          MembershipStatus.objects.filter(
              member=self.member, is_current=True
          ).update(is_current=False, end_date=self.effective_date)
      super().save(*args, **kwargs)

  ---
  🚀 ESTRATÉGIA DE IMPLEMENTAÇÃO - SEM COMPLEXIDADES

  1. IMPLEMENTAÇÃO INCREMENTAL

  - ✅ Não mexer no sistema existente - apenas adicionar
  - ✅ Dual Structure - ambos sistemas coexistem
  - ✅ Migration automática - dados antigos migram transparentemente
  - ✅ Fallback gracioso - se novo falhar, usa antigo

  2. ROLLBACK STRATEGY

  // Se der problema, é só comentar os novos componentes
  const USE_NEW_STATUS_SYSTEM = false; // Feature flag

  const getCurrentFunction = (member: Member) => {
    if (USE_NEW_STATUS_SYSTEM && member.current_status) {
      return member.current_status.status_display;
    }
    return member.ministerial_function || 'Membro'; // Fallback seguro
  };

  3. PAPÉIS EXISTENTES - ZERO MUDANÇAS

  - ✅ Mantém todos os papéis de sistema (DENOMINATION_ADMIN, CHURCH_ADMIN, etc.)
  - ✅ Mantém todas as permissões existentes
  - ✅ Adiciona apenas histórico ministerial - não confunde com papéis de sistema
  - ✅ Mesmo sistema de autorização para mudanças

  ---
  💡 RECOMENDAÇÃO FINAL

  IMPLEMENTAR GRADUALMENTE seguindo este plano:

  1. Começar pelo backend - modelo + migration + API básica
  2. Testar a migration com dados reais em ambiente dev
  3. Implementar componentes frontend - timeline simples primeiro
  4. Integrar com sistema existente - estratégia dual
  5. Validar e refinar - testes + feedback

  Esta é uma evolução natural e bem planejada do sistema existente. A estratégia dual garante zero breaking 
  changes e permite implementação segura.

  O documento está excelente e a implementação é viável sem riscos para o sistema em produção.