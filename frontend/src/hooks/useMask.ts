import { useCallback } from 'react';

export const useMask = () => {
  /**
   * Máscara para CEP: 00000-000
   */
  const cepMask = useCallback((value: string): string => {
    if (!value) return '';
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  }, []);

  /**
   * Máscara para telefone: (00) 00000-0000 ou (00) 0000-0000
   */
  const phoneMask = useCallback((value: string): string => {
    if (!value) return '';
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara baseada no tamanho
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    } else {
      // Para números com 11 dígitos (celular)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }, []);

  /**
   * Máscara para CPF: 000.000.000-00
   */
  const cpfMask = useCallback((value: string): string => {
    if (!value) return '';
    
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  }, []);

  /**
   * Remove máscara, deixando apenas números
   */
  const removeMask = useCallback((value: string): string => {
    return value.replace(/\D/g, '');
  }, []);

  return {
    cepMask,
    phoneMask,
    cpfMask,
    removeMask
  };
};
