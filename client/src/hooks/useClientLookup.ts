/**
 * Hook para busca de cliente por CNPJ com debounce
 * Busca no PostgreSQL via backend
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/queryClient';

interface ClientData {
  id?: string;
  cnpj: string;
  name: string;
  address?: string;
  city?: string;
  zip?: string;
  state?: string;
  email?: string;
  email2?: string | null;
  email3?: string | null;
}

interface LookupResponse {
  success: boolean;
  data: ClientData | null;
  message?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
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

  // Only enable query if we have a valid CNPJ and auth token
  const hasAuthToken = !!getAuthToken();

  const { data, isLoading, error, isError } = useQuery<LookupResponse>({
    queryKey: ['/api/clients/lookup-by-cnpj', debouncedCnpj],
    queryFn: async () => {
      const response = await fetch(`/api/clients/lookup-by-cnpj?cnpj=${debouncedCnpj}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ success: false, message: 'Erro ao buscar cliente' }));
        throw { status: response.status, message: errorData.message };
      }
      
      return response.json();
    },
    enabled: debouncedCnpj.length === 14 && hasAuthToken,
    retry: false,
    staleTime: 60000,
  });

 // Aceita tanto se o backend devolver { data: client } quanto se devolver o client direto na raiz
const resolvedClient = (data as any)?.data || (data as any)?.name ? (data as any) : null;

return {
  clientData: (data as any)?.data || (data as any)?.name ? ((data as any)?.data || data) : null,
  isLoading,
  isError,
  error,
  isNotFound: !isLoading && !resolvedClient,
};
}
