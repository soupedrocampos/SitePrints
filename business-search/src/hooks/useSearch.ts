/**
 * useSearch.ts — React Query hooks for business search + search history.
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { searchService, type SearchParams } from '../services/search'
import { downloadBlob } from '../services/leads'

/* ─── Query Keys ─────────────────────────── */
export const searchKeys = {
    all: ['search'] as const,
    results: (params: SearchParams) => [...searchKeys.all, 'results', params] as const,
    history: () => [...searchKeys.all, 'history'] as const,
}

/* ─── Business Search ────────────────────── */
export function useSearchBusinesses(params: SearchParams | null) {
    return useQuery({
        queryKey: searchKeys.results(params!),
        queryFn: () => searchService.searchBusinesses(params!),
        enabled: !!params && params.query.trim().length > 0,
        staleTime: 0, // always fresh — user expects live results
    })
}

/* ─── Search History (infinite) ─────────── */
export function useSearchHistory() {
    return useInfiniteQuery({
        queryKey: searchKeys.history(),
        queryFn: ({ pageParam = 1 }) => searchService.getHistory(pageParam as number, 10),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page < last.totalPages ? last.page + 1 : undefined,
    })
}

/* ─── Delete History Item ────────────────── */
export function useDeleteHistoryItem() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => searchService.deleteHistoryItem(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: searchKeys.history() })
        },
    })
}

/* ─── Clear All History ──────────────────── */
export function useClearHistory() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => searchService.clearHistory(),
        onSuccess: () => {
            qc.removeQueries({ queryKey: searchKeys.history() })
        },
    })
}

/* ─── Export History CSV ─────────────────── */
export function useExportHistory() {
    return useMutation({
        mutationFn: async () => {
            const blob = await searchService.exportHistoryCSV()
            downloadBlob(blob, `historico_buscas_${Date.now()}.csv`)
        },
    })
}

/* ─── Capture Business as Lead ───────────── */
export function useCaptureAsLead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ business, sessionId }: { business: import('../types').Business; sessionId: string }) =>
            searchService.captureAsLead(business, sessionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] })
        },
    })
}
