/**
 * useAuth Hook
 * 
 * Hook para gerenciar autenticação do usuário via JWT.
 * Tokens são armazenados no localStorage.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken, clearAuthToken, getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const token = getAuthToken();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!token,
    retry: false,
  });

  const logout = () => {
    clearAuthToken();
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return {
    user: token ? user : null,
    isLoading: token ? isLoading : false,
    isAuthenticated: !!token && !!user,
    logout,
    refetch,
  };
}
