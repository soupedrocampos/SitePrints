/**
 * googlePlaces.ts — Google Places Autocomplete + Place Details via backend proxy.
 * Calls our backend /api/places/* so the API key never ships to the browser.
 */
import { api } from './api'

/* ─── Types ─────────────────────────────── */
export interface PlacePrediction {
    placeId: string
    description: string
    mainText: string
    secondaryText: string
}

export interface PlaceDetails {
    placeId: string
    name: string
    formattedAddress: string
    lat: number
    lng: number
    types: string[]
    phone?: string
    website?: string
    rating?: number
    userRatingsTotal?: number
    openNow?: boolean
}

/* ─── Service ────────────────────────────── */
export const googlePlacesService = {
    /**
     * Autocomplete location input — returns up to 5 predictions.
     * Restricted to Brazil (country: BR).
     */
    async autocomplete(input: string): Promise<PlacePrediction[]> {
        if (input.trim().length < 3) return []
        const { data } = await api.get<PlacePrediction[]>('/places/autocomplete', {
            params: { input, country: 'BR' },
        })
        return data
    },

    /** Get full place details by placeId */
    async getDetails(placeId: string): Promise<PlaceDetails> {
        const { data } = await api.get<PlaceDetails>(`/places/details/${placeId}`)
        return data
    },

    /**
     * Reverse geocode lat/lng to a human-readable location string.
     */
    async reverseGeocode(lat: number, lng: number): Promise<string> {
        const { data } = await api.get<{ address: string }>('/places/geocode', {
            params: { lat, lng },
        })
        return data.address
    },
}
