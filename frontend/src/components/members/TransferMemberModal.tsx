import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MoveRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { branchService } from '@/services/branchService';
import type { BranchDetails } from '@/types/hierarchy';
import { membersService, type Member } from '@/services/membersService';

interface TransferMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onTransferred?: (updated: Member) => void;
}

const TransferMemberModal: React.FC<TransferMemberModalProps> = ({ isOpen, member, onClose, onTransferred }) => {
  const [branches, setBranches] = useState<BranchDetails[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const churchId = member?.church ?? null;

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !churchId) return;
      setLoadingBranches(true);
      try {
        const paginated = await branchService.getBranchesByChurch(churchId, 1, 100);
        const list = paginated.results || [];
        setBranches(list);
        // Selecionar automaticamente a primeira branch que NÃO seja a atual
        if (!selectedBranchId && list.length > 0) {
          const otherBranches = list.filter(b => b.id !== member?.branch);
          if (otherBranches.length > 0) {
            setSelectedBranchId(String(otherBranches[0].id));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar congregações:', err);
        toast.error('Não foi possível carregar as congregações da igreja');
      } finally {
        setLoadingBranches(false);
      }
    };
    load();
    // reset on close
    if (!isOpen) {
      setSelectedBranchId('');
      setReason('');
      setBranches([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, churchId]);

  const sortedBranches = useMemo(() => {
    // Matriz no topo
    const copy = [...branches];
    copy.sort((a, b) => {
      const ah = a.is_headquarters ? 0 : 1;
      const bh = b.is_headquarters ? 0 : 1;
      if (ah !== bh) return ah - bh;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [branches]);

  const handleSubmit = async () => {
    if (!member || !selectedBranchId) return;
    setSubmitting(true);
    try {
      const targetBranchId = Number(selectedBranchId);
      const { member: updated } = await membersService.transferBranch(member.id, targetBranchId, reason);
      toast.success('Membro transferido com sucesso');
      onTransferred?.(updated);
      onClose();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorData = (err as any)?.response?.data;
      const msg = errorData?.error || errorData?.message || 'Erro ao transferir membro';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Transferir membro</DialogTitle>
          <DialogDescription>
            Selecione a congregação de destino dentro da mesma igreja.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <div><span className="font-medium text-foreground">Membro:</span> {member.full_name}</div>
              <div><span className="font-medium text-foreground">Igreja:</span> {member.church_name}</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Filial de destino</label>
              <Select disabled={loadingBranches || submitting} value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingBranches ? 'Carregando congregações...' : 'Selecione a congregação de destino'} />
                </SelectTrigger>
                <SelectContent>
                  {sortedBranches.map((b) => {
                    const isCurrentBranch = member?.branch === b.id;
                    return (
                      <SelectItem 
                        key={b.id} 
                        value={String(b.id)}
                        disabled={isCurrentBranch}
                      >
                        {b.is_headquarters ? 'Matriz — ' : ''}{b.name} ({b.city}/{b.state})
                        {isCurrentBranch && ' (atual)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {member?.branch && (
                <p className="text-xs text-muted-foreground">
                  Congregação atual: {sortedBranches.find(b => b.id === member.branch)?.name || 'N/A'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da transferência (opcional)</label>
              <Textarea
                placeholder="Ex: Mudança de residência, proximidade geográfica, ministério específico..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                O motivo será registrado no histórico de transferências do membro.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || !selectedBranchId}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Transferindo...</>
                ) : (
                  <><MoveRight className="h-4 w-4 mr-2" />Transferir</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferMemberModal;

