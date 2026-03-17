/**
 * useLeads.ts — React Query hooks for all lead operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsService, type LeadFilters, type CreateLeadPayload, type UpdateLeadPayload, downloadBlob } from '../services/leads'
import type { Lead } from '../types'

/* ─── Query Keys ─────────────────────────── */
export const leadKeys = {
    all: ['leads'] as const,
    lists: () => [...leadKeys.all, 'list'] as const,
    list: (filters: LeadFilters) => [...leadKeys.lists(), filters] as const,
    details: () => [...leadKeys.all, 'detail'] as const,
    detail: (id: string) => [...leadKeys.details(), id] as const,
}

/* ─── List ───────────────────────────────── */
export function useLeads(filters: LeadFilters = {}) {
    return useQuery({
        queryKey: leadKeys.list(filters),
        queryFn: () => leadsService.getLeads(filters),
        placeholderData: (prev) => prev, // keep previous data while loading
    })
}

/* ─── Single Lead ────────────────────────── */
export function useLead(id: string) {
    return useQuery({
        queryKey: leadKeys.detail(id),
        queryFn: () => leadsService.getLead(id),
        enabled: !!id,
    })
}

/* ─── Create ─────────────────────────────── */
export function useCreateLead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateLeadPayload) => leadsService.createLead(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: leadKeys.lists() })
        },
    })
}

/* ─── Update ─────────────────────────────── */
export function useUpdateLead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) =>
            leadsService.updateLead(id, payload),
        onSuccess: (updated: Lead) => {
            qc.setQueryData(leadKeys.detail(updated.id), updated)
            qc.invalidateQueries({ queryKey: leadKeys.lists() })
        },
    })
}

/* ─── Delete ─────────────────────────────── */
export function useDeleteLead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => leadsService.deleteLead(id),
        onSuccess: (_: void, id: string) => {
            qc.removeQueries({ queryKey: leadKeys.detail(id) })
            qc.invalidateQueries({ queryKey: leadKeys.lists() })
        },
    })
}

/* ─── Bulk status ────────────────────────── */
export function useBulkUpdateStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: Lead['status'] }) =>
            leadsService.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: leadKeys.all })
        },
    })
}

/* ─── Enrich ─────────────────────────────── */
export function useEnrichLead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => leadsService.enrichLead(id),
        onSuccess: (updated: Lead) => {
            qc.setQueryData(leadKeys.detail(updated.id), updated)
        },
    })
}

/* ─── CSV Export ─────────────────────────── */
export function useExportLeads() {
    return useMutation({
        mutationFn: async (filters: LeadFilters) => {
            const blob = await leadsService.exportCSV(filters)
            downloadBlob(blob, `leads_${Date.now()}.csv`)
        },
    })
}
