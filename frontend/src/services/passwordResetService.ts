/**
 * Serviço para recuperação de senha
 * 
 * Endpoints:
 * - POST /api/v1/auth/password-reset/request/ - Solicitar reset
 * - POST /api/v1/auth/password-reset/validate/ - Validar token
 * - POST /api/v1/auth/password-reset/confirm/ - Confirmar nova senha
 */
import { api } from '@/config/api';

export interface RequestPasswordResetData {
  email: string;
}

export interface ValidateTokenData {
  token: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetResponse {
  message: string;
  detail?: string;
}

export interface ValidateTokenResponse {
  message: string;
  valid: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  detail?: string;
  user_email?: string;
}

export const passwordResetService = {
  /**
   * Solicita redefinição de senha
   * Envia email com link de reset para o usuário
   */
  async requestReset(data: RequestPasswordResetData): Promise<PasswordResetResponse> {
    const response = await api.post<PasswordResetResponse>(
      '/auth/password-reset/request/',
      data
    );
    return response.data;
  },

  /**
   * Valida se um token de reset é válido
   * Útil para verificar antes de mostrar o formulário
   */
  async validateToken(data: ValidateTokenData): Promise<ValidateTokenResponse> {
    const response = await api.post<ValidateTokenResponse>(
      '/auth/password-reset/validate/',
      data
    );
    return response.data;
  },

  /**
   * Confirma a redefinição de senha com nova senha
   */
  async confirmReset(data: ResetPasswordData): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/password-reset/confirm/',
      data
    );
    return response.data;
  },
};
