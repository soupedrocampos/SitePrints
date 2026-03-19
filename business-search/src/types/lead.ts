export type LeadStatus = 'Novo' | 'Contatado' | 'Qualificado' | 'Convertido' | 'Rejeitado'
export type LeadSource = 'Google Maps' | 'Manual' | 'Import'
export type EnrichmentStatus = 'enriched' | 'pending' | 'failed'
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'status_change' | 'enrichment' | 'created'

export interface CNAEItem { code: string; description: string }

export interface CNPJEnrichment {
    status: EnrichmentStatus
    lastEnrichedAt?: string
    matchConfidence?: number
    legalName?: string
    cnaePrimary?: CNAEItem
    cnaeSecondary?: CNAEItem[]
    companySize?: string
    legalNature?: string
    foundingDate?: string
    shareCapital?: number
    simplesNacional?: boolean
    mei?: boolean
    companyStatus?: 'Ativa' | 'Inapta' | 'Baixada' | 'Suspensa'
    address?: {
        street: string; number: string; complement?: string
        neighborhood: string; city: string; state: string; zip: string
    }
}

export interface GooglePlacesData {
    placeId?: string
    rating?: number
    reviewCount?: number
    types?: string[]
    mapsUrl?: string
}

export interface Activity {
    id: string
    type: ActivityType
    description: string
    user: string
    timestamp: string // ISO
}

export interface DataQuality {
    completeness: number  // 0-100
    flags: string[]
    addressDiscrepancy?: string
}

export type WhatsAppStatus = 'unchecked' | 'valid' | 'invalid' | 'checking'

export interface Lead {
    id: string
    name: string
    tradeName?: string
    cnpj: string
    status: LeadStatus
    source: LeadSource
    quality: number
    city: string
    state: string
    phone?: string
    website?: string
    email?: string
    address?: string
    enriched: boolean
    created_at: string
    notes?: string
    whatsappStatus?: WhatsAppStatus
    // Extended
    cnpjEnrichment?: CNPJEnrichment
    placesData?: GooglePlacesData
    activities?: Activity[]
    dataQuality?: DataQuality
    sessionId?: string
}

export interface LeadFilters {
    search: string
    statuses: LeadStatus[]
    sources: LeadSource[]
    dateFrom: string
    dateTo: string
    enriched: boolean | null
    qualityMin: number
    qualityMax: number
    onlyWithWebsite: boolean
    sessionId?: string
}

export type SortField = 'name' | 'status' | 'quality' | 'city' | 'created_at' | 'whatsapp'
export type SortDir = 'asc' | 'desc'
