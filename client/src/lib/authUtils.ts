/**
 * Auth Utilities
 * 
 * Funções auxiliares para tratamento de erros de autenticação
 */

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
