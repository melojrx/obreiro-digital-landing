import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberForm } from '../MemberForm';
import type { Member } from '@/services/membersService';
import { api } from '@/config/api';

const authState = {
  user: { id: 1, email: 'admin@example.com', full_name: 'Admin User' },
  userChurch: null,
  uploadAvatar: vi.fn(),
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

const permissionsMock = {
  canManageDenominations: false,
  canManageChurches: true,
  canManageChurch: true,
  canManageMembers: true,
  isChurchAdmin: true,
  isSecretary: false,
};

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissionsMock,
}));

vi.mock('@/hooks/useActiveChurch', () => ({
  useCurrentActiveChurch: () => ({ id: 1, short_name: 'Matriz' }),
}));

vi.mock('@/services/churchService', () => ({
  churchService: {
    getManagedChurches: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

const baseMember: Member = {
  id: 42,
  church: 1,
  church_name: 'Igreja Teste',
  branch: null,
  branch_name: null,
  full_name: 'Admin User',
  cpf: undefined,
  rg: undefined,
  birth_date: '1990-01-01',
  age: 30,
  gender: 'M',
  marital_status: 'single',
  email: 'admin@example.com',
  phone: '(11) 99999-9999',
  phone_secondary: undefined,
  address: 'Rua A, 123',
  number: '123',
  complement: '',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipcode: '01000-000',
  full_address: 'Rua A, 123 - Centro - São Paulo/SP',
  membership_status: 'active',
  membership_statuses: [],
  membership_date: '2020-01-01',
  membership_start_date: '2020-01-01',
  membership_end_date: null,
  membership_years: 4,
  ministerial_function: 'member',
  ministerial_function_display: 'Membro',
  previous_church: '',
  transfer_letter: false,
  profession: '',
  education_level: '',
  photo: null,
  notes: '',
  accept_sms: true,
  accept_email: true,
  accept_whatsapp: true,
  spouse: null,
  spouse_name: null,
  spouse_is_member: false,
  spouse_member: undefined,
  spouse_member_name: undefined,
  children_count: undefined,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2020-01-01T00:00:00Z',
  is_active: true,
  has_system_access: false,
  system_user_email: null,
  system_user_role: null,
  system_user_role_label: null,
};

describe('MemberForm system access section', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({ data: { results: [] } } as any);
    authState.user = { id: 1, email: 'admin@example.com', full_name: 'Admin User' };
  });

  it('hides system access controls when editing the current user', async () => {
    const member: Member = {
      ...baseMember,
      user: 1,
      has_system_access: true,
      system_user_email: 'admin@example.com',
      system_user_role: 'church_admin',
      system_user_role_label: 'Administrador da Igreja (Nível 2)',
    };

    render(
      <MemberForm
        member={member}
        title="Editar Membro"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const additionalTab = screen.getByRole('tab', { name: /Informações Adicionais/i });
    await userEvent.click(additionalTab);

    expect(
      screen.getByText(/Alterações de permissão não estão disponíveis ao editar o próprio usuário/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Usuário terá acesso ao sistema/i)).not.toBeInTheDocument();
  });

  it('shows read-only message when member already has linked system user', async () => {
    authState.user = { id: 99, email: 'other@example.com', full_name: 'Outro Usuário' };

    const member: Member = {
      ...baseMember,
      user: null,
      has_system_access: true,
      system_user_email: 'existing@example.com',
    };

    render(
      <MemberForm
        member={member}
        title="Editar Membro"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const additionalTab = screen.getByRole('tab', { name: /Informações Adicionais/i });
    await userEvent.click(additionalTab);

    expect(
      screen.getByText(/já possui acesso ao sistema vinculado/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Usuário terá acesso ao sistema/i)).not.toBeInTheDocument();
  });
});
