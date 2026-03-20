/**
 * api.ts — Shared Axios instance with interceptors, typed errors and auth headers.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios'

/* ─── Types ─────────────────────────────── */
export interface ApiError {
    message: string
    code?: string
    status: number
}

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

/* ─── Instance ───────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002/api'

export const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 0, // No timeout to allow slow background scraping
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

/* ─── Request interceptor — attach token ── */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    },
    (error) => Promise.reject(error)
)

/* ─── Response interceptor — normalise errors ── */
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const apiError: ApiError = {
            message: 'Erro desconhecido',
            status: error.response?.status ?? 0,
        }

        if (error.response?.data) {
            const d = error.response.data as Record<string, unknown>
            apiError.message = (d.message as string) ?? apiError.message
            apiError.code = d.code as string | undefined
        } else if (error.request) {
            apiError.message = 'Sem resposta do servidor — verifique sua conexão'
        } else {
            apiError.message = error.message
        }

        return Promise.reject(apiError)
    }
)

/* ─── Helpers ────────────────────────────── */
export function isApiError(e: unknown): e is ApiError {
    return typeof e === 'object' && e !== null && 'status' in e && 'message' in e
}
