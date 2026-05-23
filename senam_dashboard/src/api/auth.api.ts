import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { AuthTokens, Principal } from '@/types/domain';

export interface LoginPayload {
  email: string;
  password: string;
  principal: Extract<Principal, 'admin' | 'provider'>;
}

export function usePasswordLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthTokens>(EP.auth.login, payload, { skipAuthRetry: true }),
  });
}
