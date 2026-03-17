export interface BusinessLink {
    label: string
    url: string
}

export interface Business {
    place_id: string
    name: string
    address: string
    phone?: string | null
    rating?: number | null
    website?: string | null
    type: string
    accessible?: boolean
    response_time?: number | null
    status_code?: number | null
    screenshot?: string | null
    links?: BusinessLink[]
}

export type BusinessType = 'Restaurante' | 'Hotel' | 'Varejo' | 'Serviços' | 'Saúde' | 'Educação' | 'Todos'

export interface SearchState {
    query: string
    location: string
    radius: number
    selectedTypes: BusinessType[]
}

export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'warning'
}
