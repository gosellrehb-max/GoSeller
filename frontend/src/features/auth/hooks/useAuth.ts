'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth as useAuthContext, type AccountType } from '@/contexts/AuthContext';

type LoginInput = { email: string; password: string; role: AccountType };

export function useAuth() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, role }: LoginInput) => {
      await auth.loginWithAccountType(email, password, role);
      return { role };
    },
    onSuccess: ({ role }) => {
      queryClient.setQueryData(['auth', 'session'], {
        isAuthenticated: true,
        role,
        ts: Date.now(),
      });
    },
  });

  return {
    ...auth,
    loginMutation,
  };
}

