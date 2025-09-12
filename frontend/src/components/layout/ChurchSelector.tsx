import React from 'react';
import { Check, ChevronDown, Building2, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserChurches, useCurrentActiveChurch, useSetActiveChurch } from '@/hooks/useActiveChurch';

export const ChurchSelector: React.FC = () => {
  const { data: userChurches, isLoading: isLoadingChurches } = useUserChurches();
  const activeChurch = useCurrentActiveChurch();
  const setActiveChurch = useSetActiveChurch();

  // Se não tem múltiplas igrejas, não mostrar o seletor
  if (!userChurches || userChurches.count <= 1) {
    return null;
  }

  const handleChurchSelect = (churchId: number) => {
    if (activeChurch?.id !== churchId) {
      setActiveChurch.mutate(churchId);
    }
  };

  if (isLoadingChurches) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={setActiveChurch.isPending}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate">
                {activeChurch?.name || 'Selecione uma igreja'}
              </span>
              {activeChurch && (
                <span className="text-xs text-muted-foreground">
                  {activeChurch.city}, {activeChurch.state}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Selecionar Igreja
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userChurches.churches.map((church) => (
          <DropdownMenuItem
            key={church.id}
            onClick={() => handleChurchSelect(church.id)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {church.is_active && (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
              
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {church.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {church.role}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{church.city}, {church.state}</span>
                  </div>
                  
                  {church.denomination_name && (
                    <span className="truncate">
                      {church.denomination_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          {userChurches.count} {userChurches.count === 1 ? 'igreja' : 'igrejas'} disponíveis
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};