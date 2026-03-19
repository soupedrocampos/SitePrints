/**
 * searchHistory.ts — Service to manage search history in localStorage
 */

export type BusinessType = 'Restaurante' | 'Varejo' | 'Serviços' | 'Saúde' | 'Educação' | 'Automóveis' | 'Hotel' | 'Academia' | string

export interface SearchHistoryItem {
    id: string
    query: string
    location: string
    timestamp: Date
    radiusKm: number
    types: BusinessType[]
    additionalFilters: string[]
    resultsFound: number
    leadsCaptured: number
    sessionId: string
    searchMode: 'simple' | 'mass'
    categories?: string[]
}

const HISTORY_STORAGE_KEY = 'crm_search_history'

export const searchHistoryService = {
    getHistory(): SearchHistoryItem[] {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
        if (!stored) return []
        try {
            const parsed = JSON.parse(stored)
            return parsed.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }))
        } catch (e) {
            console.error('Failed to parse search history', e)
            return []
        }
    },

    saveHistoryItem(item: Omit<SearchHistoryItem, 'id' | 'timestamp' | 'sessionId' | 'leadsCaptured'>): SearchHistoryItem {
        const history = this.getHistory()
        const newItem: SearchHistoryItem = {
            ...item,
            id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date(),
            sessionId: `sess-${Date.now()}`,
            leadsCaptured: 0,
        }
        history.unshift(newItem)
        // Keep only last 100 items
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 100)))
        return newItem
    },

    deleteHistoryItem(id: string): void {
        const history = this.getHistory()
        const filtered = history.filter(h => h.id !== id)
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered))
    },

    clearHistory(): void {
        localStorage.removeItem(HISTORY_STORAGE_KEY)
    },

    incrementLeadsCaptured(sessionId: string): void {
        const history = this.getHistory()
        const index = history.findIndex(h => h.sessionId === sessionId)
        if (index !== -1) {
            history[index].leadsCaptured += 1
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
        }
    }
}

/** Group items by date category */
export type DateGroup = 'Hoje' | 'Ontem' | 'Última Semana' | 'Últimos 30 Dias'

export function getDateGroup(ts: Date): DateGroup {
    const now = new Date()
    const diffH = (now.getTime() - ts.getTime()) / 3_600_000
    if (diffH < 24 && now.getDate() === ts.getDate()) return 'Hoje'
    if (diffH < 48 && (now.getDate() - ts.getDate() === 1 || ts.getDate() - now.getDate() > 27)) return 'Ontem'
    if (diffH < 168) return 'Última Semana'
    return 'Últimos 30 Dias'
}

/** Friendly relative time label */
export function relativeTime(ts: Date): string {
    const now = new Date()
    const diffM = Math.floor((now.getTime() - ts.getTime()) / 60_000)
    if (diffM < 1) return 'agora mesmo'
    if (diffM < 60) return `${diffM} min atrás`
    const diffH = Math.floor(diffM / 60)
    if (diffH < 24) return `${diffH}h atrás`
    const diffD = Math.floor(diffH / 24)
    return `${diffD} dia${diffD > 1 ? 's' : ''} atrás`
}

/** Export search history to CSV (browser download) */
export function exportHistoryCSV(items: SearchHistoryItem[]) {
    const header = 'ID,Consulta,Local,Data/Hora,Modo,Tipos/Categorias,Resultados,Leads Capturados'
    const rows = items.map(i =>
        [
            i.id,
            `"${i.query}"`,
            `"${i.location}"`,
            i.timestamp.toLocaleString('pt-BR'),
            i.searchMode,
            `"${i.searchMode === 'mass' ? i.categories?.join('; ') : i.types.join('; ')}"`,
            i.resultsFound,
            i.leadsCaptured,
        ].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'historico-buscas.csv'
    a.click()
    URL.revokeObjectURL(url)
}
