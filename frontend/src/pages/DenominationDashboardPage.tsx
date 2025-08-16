/**
 * Dashboard Profissional para Administradores de Denominação
 * Novo dashboard executivo com KPIs, rankings e análises avançadas
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import AppLayout from '@/components/layout/AppLayout';
import DenominationDashboardProfessional from '@/components/hierarchy/DenominationDashboardProfessional';

const DenominationDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions();

  // Verificar se o usuário tem permissão para acessar dashboard denominacional
  if (!permissions.canManageDenomination && !permissions.canViewDenominationStats) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar o dashboard denominacional.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DenominationDashboardProfessional />
    </AppLayout>
  );
};

export default DenominationDashboardPage;