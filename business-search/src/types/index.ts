/**
 * src/types/index.ts — Barrel re-exporting all domain types + shared API types.
 */

// Domain types
export type { Business } from './business'
export type { Lead } from './lead'

// Shared API generics
export interface ApiResponse<T> {
    data: T
    message?: string
    success: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    perPage: number
    totalPages: number
}

// Shared filter / UI state
export interface DateRange {
    from?: Date
    to?: Date
}

export interface FilterState {
    search?: string
    dateRange?: DateRange
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    perPage?: number
}

// Address
export interface Address {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city: string
    state: string
    zip?: string
    country?: string
    lat?: number
    lng?: number
}

// Search params (shared between search page and hook)
export interface SearchParams {
    query: string
    location: string
    lat?: number
    lng?: number
    radius: number
    types?: string[]
    minRating?: number
    requireWebsite?: boolean
    requirePhone?: boolean
    page?: number
    perPage?: number
}
