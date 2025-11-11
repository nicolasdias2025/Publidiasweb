/**
 * Hook para busca de cliente por CNPJ com debounce
 * Integração com Google Sheets via backend
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ClientData {
  cnpj: string;
  razaoSocial: string;
  endereco: string;
  cidade: string;
  cep: string;
  uf: string;
  email: string;
}

export function useClientLookup(cnpj: string) {
  const [debouncedCnpj, setDebouncedCnpj] = useState('');

  // Debounce de 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = cnpj.replace(/\D/g, '');
      if (normalized.length === 14) {
        setDebouncedCnpj(normalized);
      } else {
        setDebouncedCnpj('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cnpj]);

  const { data, isLoading, error, isError } = useQuery<ClientData>({
    queryKey: ['/api/clients', debouncedCnpj],
    queryFn: async () => {
      const response = await fetch(`/api/clients?cnpj=${debouncedCnpj}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar cliente' }));
        throw { status: response.status, message: errorData.message };
      }
      
      return response.json();
    },
    enabled: debouncedCnpj.length === 14,
    retry: false,
    staleTime: Infinity,
  });

  return {
    clientData: data,
    isLoading,
    isError,
    error,
    isNotFound: isError && (error as any)?.status === 404,
  };
}
