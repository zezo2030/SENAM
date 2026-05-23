import { useState, type ReactNode } from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ApiError } from '@/lib/api/client';

function toastFromError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 401) return;
    toast.error(err.message ?? 'Request failed');
    return;
  }
  if (err instanceof Error) toast.error(err.message);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status === 401) return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
        queryCache: new QueryCache({ onError: toastFromError }),
        mutationCache: new MutationCache({ onError: toastFromError }),
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-center" />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
