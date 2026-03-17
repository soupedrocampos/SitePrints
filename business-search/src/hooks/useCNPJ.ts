/**
 * useCNPJ.ts — React Query hooks for CNPJ lookup.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { cnpjService, type CNPJData } from '../services/cnpj'
import { validateCNPJ, stripCNPJ } from '../utils/cnpjValidator'

/* ─── Mutation (on-demand lookup) ────────── */
export function useCNPJLookup() {
    return useMutation({
        mutationFn: (cnpj: string) => {
            const clean = stripCNPJ(cnpj)
            if (!validateCNPJ(clean)) {
                throw new Error('CNPJ inválido — verifique os dígitos')
            }
            return cnpjService.lookup(clean)
        },
    })
}

/* ─── Query (cache-backed, for pre-fetch) ── */
export function useCNPJQuery(cnpj: string) {
    const clean = stripCNPJ(cnpj)
    const valid = validateCNPJ(clean)

    return useQuery<CNPJData>({
        queryKey: ['cnpj', clean],
        queryFn: () => cnpjService.lookup(clean),
        enabled: valid,
        staleTime: 24 * 60 * 60 * 1000, // CNPJ data changes rarely — 24h cache
        retry: 1,
    })
}
