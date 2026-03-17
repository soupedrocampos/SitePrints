/**
 * queryClient.ts — Shared React Query client instance.
 * Import this in main.tsx for <QueryClientProvider>.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            /** 5 minutes stale time — most CRM data doesn't change every second */
            staleTime: 5 * 60 * 1000,
            /** 10 minutes garbage-collection time */
            gcTime: 10 * 60 * 1000,
            /** Retry once on failure, no retry on 4xx */
            retry: (failureCount, error: unknown) => {
                const status = (error as { status?: number })?.status
                if (status && status >= 400 && status < 500) return false
                return failureCount < 1
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
})
