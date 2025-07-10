import { api } from '@/config/api';
import { AxiosError } from 'axios';

// Classe para erros da API
export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Interface para resposta da API de CEP
export interface CEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
}

// Função para buscar endereço por CEP
export const getAddressByCEP = async (cep: string): Promise<CEPAddress> => {
  try {
    // Limpar o CEP (remover caracteres não numéricos)
    const cleanCep = cep.replace(/\D/g, '');
    const response = await api.get(`/core/cep/${cleanCep}/`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>;
    if (axiosError.response?.status === 404) {
      throw new APIError('CEP não encontrado. Verifique o número digitado.');
    } else if (axiosError.response?.status === 503) {
      throw new APIError('Serviço de busca de CEP indisponível. Tente novamente mais tarde.');
    } else {
      throw new APIError('Erro ao buscar CEP. Verifique sua conexão com a internet.');
    }
  }
};

// Interface para planos de assinatura
export interface SubscriptionPlan {
  id: string;
  name: string;
  features: string[];
  price: string;
  period: string;
}

// Função para buscar planos de assinatura
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await api.get('/core/subscription-plans/');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Erro ao buscar planos:', axiosError);
    throw new APIError('Erro ao carregar planos de assinatura.');
  }
}; 