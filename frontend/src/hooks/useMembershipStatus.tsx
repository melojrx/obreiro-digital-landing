import { useState, useCallback } from 'react';
import { 
  MembershipStatus, 
  CreateMembershipStatusData, 
  membershipStatusService 
} from '@/services/membersService';
import { useToast } from '@/hooks/use-toast';

interface UseMembershipStatusReturn {
  membershipStatuses: MembershipStatus[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  loadMemberHistory: (memberId: number) => Promise<void>;
  getCurrentStatus: (memberId: number) => Promise<MembershipStatus | null>;
  createStatus: (data: CreateMembershipStatusData) => Promise<MembershipStatus | null>;
  updateStatus: (id: number, data: Partial<CreateMembershipStatusData>) => Promise<MembershipStatus | null>;
  changeStatus: (memberId: number, newStatus: string, reason?: string) => Promise<MembershipStatus | null>;
  deleteStatus: (id: number) => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useMembershipStatus = (initialMemberId?: number): UseMembershipStatusReturn => {
  const [membershipStatuses, setMembershipStatuses] = useState<MembershipStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedMemberId, setLastLoadedMemberId] = useState<number | undefined>(initialMemberId);
  
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error);
    const errorMessage = error?.response?.data?.message || error?.message || message;
    setError(errorMessage);
    toast({
      title: 'Erro',
      description: errorMessage,
      variant: 'destructive'
    });
  }, [toast]);

  const loadMemberHistory = useCallback(async (memberId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statuses = await membershipStatusService.getMemberHistory(memberId);
      setMembershipStatuses(statuses);
      setLastLoadedMemberId(memberId);
    } catch (err) {
      handleError(err, 'Não foi possível carregar o histórico de status ministerial.');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getCurrentStatus = useCallback(async (memberId: number): Promise<MembershipStatus | null> => {
    try {
      const currentStatus = await membershipStatusService.getCurrentStatus(memberId);
      return currentStatus;
    } catch (err) {
      handleError(err, 'Não foi possível obter o status atual.');
      return null;
    }
  }, [handleError]);

  const createStatus = useCallback(async (data: CreateMembershipStatusData): Promise<MembershipStatus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newStatus = await membershipStatusService.createStatus(data);
      
      // Recarrega o histórico se for do membro atual
      if (lastLoadedMemberId === data.member) {
        await loadMemberHistory(data.member);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Status ministerial criado com sucesso.',
      });
      
      return newStatus;
    } catch (err) {
      handleError(err, 'Não foi possível criar o status ministerial.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, lastLoadedMemberId, loadMemberHistory]);

  const updateStatus = useCallback(async (
    id: number, 
    data: Partial<CreateMembershipStatusData>
  ): Promise<MembershipStatus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedStatus = await membershipStatusService.updateStatus(id, data);
      
      // Atualiza localmente
      setMembershipStatuses(prev => 
        prev.map(status => 
          status.id === id ? { ...status, ...updatedStatus } : status
        )
      );
      
      toast({
        title: 'Sucesso',
        description: 'Status ministerial atualizado com sucesso.',
      });
      
      return updatedStatus;
    } catch (err) {
      handleError(err, 'Não foi possível atualizar o status ministerial.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast]);

  const changeStatus = useCallback(async (
    memberId: number, 
    newStatus: string, 
    reason?: string
  ): Promise<MembershipStatus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statusChange = await membershipStatusService.changeStatus(memberId, newStatus, reason);
      
      // Recarrega o histórico se for do membro atual
      if (lastLoadedMemberId === memberId) {
        await loadMemberHistory(memberId);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Status ministerial alterado com sucesso.',
      });
      
      return statusChange;
    } catch (err) {
      handleError(err, 'Não foi possível alterar o status ministerial.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, lastLoadedMemberId, loadMemberHistory]);

  const deleteStatus = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await membershipStatusService.deleteStatus(id);
      
      // Remove localmente
      setMembershipStatuses(prev => prev.filter(status => status.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Status ministerial removido com sucesso.',
      });
    } catch (err) {
      handleError(err, 'Não foi possível remover o status ministerial.');
      throw err; // Re-lança para componentes que precisam saber se falhou
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast]);

  const refresh = useCallback(async (): Promise<void> => {
    if (lastLoadedMemberId) {
      await loadMemberHistory(lastLoadedMemberId);
    }
  }, [lastLoadedMemberId, loadMemberHistory]);

  return {
    membershipStatuses,
    isLoading,
    error,
    
    // Ações
    loadMemberHistory,
    getCurrentStatus,
    createStatus,
    updateStatus,
    changeStatus,
    deleteStatus,
    
    // Utilitários
    clearError,
    refresh,
  };
};