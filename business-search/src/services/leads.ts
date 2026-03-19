/**
 * leads.ts — Lead CRUD + export services.
 */
import { api, type ApiResponse, type PaginatedResponse } from './api'
import type { Lead } from '../types'

/* ─── Filters / Params ───────────────────── */
export interface LeadFilters {
    status?: Lead['status'][]
    source?: Lead['source'][]
    search?: string
    city?: string
    state?: string
    enriched?: boolean
    qualityMin?: number
    qualityMax?: number
    createdAfter?: string
    createdBefore?: string
    onlyWithWebsite?: boolean
    sessionId?: string
    page?: number
    perPage?: number
    sortBy?: 'createdAt' | 'qualityScore' | 'companyName'
    sortDir?: 'asc' | 'desc'
}

export interface CreateLeadPayload {
    cnpj: string
    companyName: string
    tradeName?: string
    website?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    state?: string
    source: Lead['source']
    notes?: string
    sessionId?: string
    placesData?: {
        placeId?: string
        rating?: number
        reviewCount?: number
    }
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
    status?: Lead['status']
    qualityScore?: number
}

/* ─── Service ────────────────────────────── */

// Constants for local storage
const LEADS_STORAGE_KEY = 'crm_captured_leads'

// Helper to get leads from storage
const getStoredLeads = (): Lead[] => {
    const stored = localStorage.getItem(LEADS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
}

// Helper to save leads to storage
const saveLeadsToStorage = (leads: Lead[]): void => {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads))
}

/* ─── Service ────────────────────────────── */
export const leadsService = {
    /** Fetch paginated + filtered lead list */
    async getLeads(filters: LeadFilters = {}): Promise<PaginatedResponse<Lead>> {
        let leads = getStoredLeads()

        // Filtering
        if (filters.search) {
            const q = filters.search.toLowerCase()
            leads = leads.filter(l =>
                l.name.toLowerCase().includes(q) ||
                l.cnpj.includes(q) ||
                (l.address && l.address.toLowerCase().includes(q))
            )
        }
        if (filters.status && filters.status.length > 0) {
            leads = leads.filter(l => filters.status!.includes(l.status as any))
        }
        if (filters.source && filters.source.length > 0) {
            leads = leads.filter(l => filters.source!.includes(l.source as any))
        }
        if (filters.onlyWithWebsite) {
            leads = leads.filter(l => !!l.website && l.website.trim() !== '')
        }
        if (filters.sessionId) {
            leads = leads.filter(l => l.sessionId === filters.sessionId)
        }

        // Sorting
        const sortBy = filters.sortBy || 'createdAt'
        const sortDir = filters.sortDir || 'desc'
        leads.sort((a, b) => {
            let valA: any = (a as any)[sortBy]
            let valB: any = (b as any)[sortBy]
            if (sortBy === 'createdAt') {
                valA = new Date(a.created_at).getTime()
                valB = new Date(b.created_at).getTime()
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1
            if (valA > valB) return sortDir === 'asc' ? 1 : -1
            return 0
        })

        // Pagination
        const page = filters.page || 1
        const perPage = filters.perPage || 10
        const total = leads.length
        const totalPages = Math.ceil(total / perPage)
        const start = (page - 1) * perPage
        const data = leads.slice(start, start + perPage)

        return {
            data,
            total,
            page,
            perPage,
            totalPages
        }
    },

    /** Fetch single lead by ID */
    async getLead(id: string): Promise<Lead> {
        const leads = getStoredLeads()
        const lead = leads.find(l => l.id === id)
        if (!lead) throw new Error('Lead não encontrado')
        return lead
    },

    /** Create a new lead */
    async createLead(payload: CreateLeadPayload): Promise<Lead> {
        const leads = getStoredLeads()
        const newLead: Lead = {
            id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: payload.companyName,
            tradeName: payload.tradeName,
            cnpj: payload.cnpj,
            status: 'Novo',
            source: payload.source,
            quality: Math.floor(20 + Math.random() * 80),
            city: payload.city || '',
            state: payload.state || '',
            phone: payload.phone,
            website: payload.website,
            email: payload.email,
            address: payload.address,
            enriched: false,
            created_at: new Date().toISOString(),
            notes: payload.notes,
            activities: [
                {
                    id: `act-${Date.now()}`,
                    type: 'created',
                    description: `Lead capturado via ${payload.source}`,
                    user: 'Sistema',
                    timestamp: new Date().toISOString()
                }
            ],
            dataQuality: {
                completeness: 50,
                flags: []
            },
            sessionId: payload.sessionId,
            placesData: payload.placesData ? {
                placeId: payload.placesData.placeId,
                rating: payload.placesData.rating,
                reviewCount: payload.placesData.reviewCount,
            } : undefined,
        }
        leads.unshift(newLead)
        saveLeadsToStorage(leads)
        return newLead
    },

    /** Partially update a lead */
    async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
        const leads = getStoredLeads()
        const index = leads.findIndex(l => l.id === id)
        if (index === -1) throw new Error('Lead não encontrado')

        const updated = {
            ...leads[index],
            ...payload,
            name: payload.companyName || leads[index].name,
        } as Lead

        leads[index] = updated
        saveLeadsToStorage(leads)
        return updated
    },

    /** Delete a lead */
    async deleteLead(id: string): Promise<void> {
        const leads = getStoredLeads()
        const filtered = leads.filter(l => l.id !== id)
        saveLeadsToStorage(filtered)
    },

    /** Bulk status update */
    async bulkUpdateStatus(ids: string[], status: Lead['status']): Promise<void> {
        const leads = getStoredLeads()
        const updated = leads.map(l => ids.includes(l.id) ? { ...l, status } : l) as Lead[]
        saveLeadsToStorage(updated)
    },

    /** Export filtered leads as CSV blob */
    async exportCSV(filters: LeadFilters = {}): Promise<Blob> {
        const { data } = await this.getLeads({ ...filters, perPage: 1000 })
        const headers = ['ID', 'Empresa', 'CNPJ', 'Status', 'Fonte', 'Score', 'Cidade', 'Estado', 'Criado em']
        const rows = data.map(l => [
            l.id, l.name, l.cnpj, l.status, l.source, l.quality, l.city, l.state, l.created_at
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${v}"`).join(','))
        ].join('\n')

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    },

    /** Trigger CNPJ enrichment for a lead */
    async enrichLead(id: string): Promise<Lead> {
        const lead = await this.getLead(id)
        const updated = {
            ...lead,
            enriched: true,
            quality: Math.min(100, (lead.quality || 0) + 20),
            cnpjEnrichment: {
                status: 'enriched',
                lastEnrichedAt: new Date().toISOString(),
                matchConfidence: 95,
                legalName: lead.name.toUpperCase() + ' LTDA',
                cnaePrimary: { code: '5611-2/01', description: 'Restaurantes e similares' }
            }
        } as Lead
        return this.updateLead(id, updated as any)
    },
}

/* ─── CSV Download helper ────────────────── */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
