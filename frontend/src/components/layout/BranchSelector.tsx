import React from 'react';
import { Check, ChevronDown, GitBranch } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useCurrentActiveChurch, useSetActiveChurch } from '@/hooks/useActiveChurch';
import branchService from '@/services/branchService';

export const BranchSelector: React.FC = () => {
  const activeChurch = useCurrentActiveChurch();
  const setActiveChurch = useSetActiveChurch();

  const activeBranchId = activeChurch?.active_branch?.id ?? null;
  const churchId = activeChurch?.id ?? null;

  const { data, isLoading } = useQuery({
    // Inclui churchId e activeBranchId na chave para evitar cache cruzado
    queryKey: ['branches', { churchId, activeBranchId }],
    queryFn: async () => {
      if (!churchId) return { results: [], count: 0 } as any;
      return await branchService.getBranchesByChurch(churchId, 1, 100);
    },
    enabled: !!churchId,
    staleTime: 1000 * 30,
  });

  const branches = data?.results ?? [];

  // Se não há igreja ativa ou menos de 2 congregações, esconder seletor
  if (!churchId || branches.length <= 1) {
    return null;
  }

  const handleSelectBranch = (branchId: number) => {
    if (!churchId) return;
    if (activeBranchId !== branchId) {
      setActiveChurch.mutate({ churchId, branchId });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={setActiveChurch.isPending || isLoading}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate">
                {activeChurch?.active_branch?.name || 'Selecione uma congregação'}
              </span>
              {activeChurch && (
                <span className="text-xs text-muted-foreground truncate">
                  {activeChurch.name}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Selecionar Filial
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {branches.map((branch: any) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSelectBranch(branch.id)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            {activeBranchId === branch.id && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">{branch.name}</span>
              <span className="text-xs text-muted-foreground truncate">{branch.city}/{branch.state}</span>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          {branches.length} {branches.length === 1 ? 'congregação' : 'congregações'} disponíveis
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BranchSelector;

