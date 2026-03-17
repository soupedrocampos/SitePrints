/**
 * search.ts — Business search + search history services.
 */
import { api, type PaginatedResponse } from './api'
import type { Business } from '../types'

/* ─── Types ─────────────────────────────── */
export interface SearchParams {
    query: string
    location: string
    lat?: number
    lng?: number
    radius: number           // km
    types?: string[]
    minRating?: number
    requireWebsite?: boolean
    requirePhone?: boolean
    page?: number
    perPage?: number
}

export interface SearchHistoryItem {
    id: string
    query: string
    location: string
    radius: number
    types: string[]
    filters: string[]
    resultsCount: number
    leadsCount: number
    sessionId: string
    createdAt: string
}

export interface SearchResultsResponse {
    results: Business[]
    total: number
    sessionId: string
    nextPageToken?: string
}

/* ─── Service ────────────────────────────── */
export const searchService = {
    /** Search businesses via backend (which calls Google Places) */
    async searchBusinesses(params: SearchParams): Promise<SearchResultsResponse> {
        const { data } = await api.get<SearchResultsResponse>('/search/businesses', { params })
        return data
    },

    /** Paginated search history */
    async getHistory(page = 1, perPage = 10): Promise<PaginatedResponse<SearchHistoryItem>> {
        const { data } = await api.get<PaginatedResponse<SearchHistoryItem>>('/search/history', {
            params: { page, perPage },
        })
        return data
    },

    /** Delete one history entry */
    async deleteHistoryItem(id: string): Promise<void> {
        await api.delete(`/search/history/${id}`)
    },

    /** Clear all history */
    async clearHistory(): Promise<void> {
        await api.delete('/search/history')
    },

    /** Export history as CSV */
    async exportHistoryCSV(): Promise<Blob> {
        const { data } = await api.get<Blob>('/search/history/export', {
            params: { format: 'csv' },
            responseType: 'blob',
        })
        return data
    },

    /** Capture a business as a lead */
    async captureAsLead(business: Business, sessionId: string): Promise<{ leadId: string }> {
        const { data } = await api.post<{ leadId: string }>('/search/capture', {
            business,
            sessionId,
        })
        return data
    },
}
