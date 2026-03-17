/**
 * Mock data for Search History page.
 */

export type BusinessType = 'Restaurante' | 'Varejo' | 'Serviços' | 'Saúde' | 'Educação' | 'Automóveis' | 'Hotel' | 'Academia'

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
}

const now = new Date('2026-02-28T15:00:00')
const mins = (m: number) => new Date(now.getTime() - m * 60_000)
const hrs = (h: number) => new Date(now.getTime() - h * 3_600_000)
const days = (d: number) => new Date(now.getTime() - d * 86_400_000)

export const SEARCH_HISTORY: SearchHistoryItem[] = [
    {
        id: 'sh-1',
        query: 'restaurantes e pizzarias',
        location: 'São Paulo, SP',
        timestamp: mins(12),
        radiusKm: 5,
        types: ['Restaurante'],
        additionalFilters: ['Com avaliação ≥ 4.0', 'Com site'],
        resultsFound: 48,
        leadsCaptured: 11,
        sessionId: 'sess-1',
    },
    {
        id: 'sh-2',
        query: 'clínicas odontológicas',
        location: 'São Paulo, SP',
        timestamp: mins(54),
        radiusKm: 10,
        types: ['Saúde'],
        additionalFilters: ['Com telefone'],
        resultsFound: 31,
        leadsCaptured: 7,
        sessionId: 'sess-2',
    },
    {
        id: 'sh-3',
        query: 'academias de ginástica',
        location: 'Campinas, SP',
        timestamp: hrs(2),
        radiusKm: 8,
        types: ['Academia'],
        additionalFilters: [],
        resultsFound: 22,
        leadsCaptured: 5,
        sessionId: 'sess-3',
    },
    {
        id: 'sh-4',
        query: 'hotéis e pousadas',
        location: 'Santos, SP',
        timestamp: hrs(4),
        radiusKm: 15,
        types: ['Hotel'],
        additionalFilters: ['Com avaliação ≥ 4.5'],
        resultsFound: 19,
        leadsCaptured: 4,
        sessionId: 'sess-4',
    },
    {
        id: 'sh-5',
        query: 'lojas de roupas femininas',
        location: 'Guarulhos, SP',
        timestamp: hrs(6),
        radiusKm: 5,
        types: ['Varejo'],
        additionalFilters: ['Com Instagram'],
        resultsFound: 55,
        leadsCaptured: 12,
        sessionId: 'sess-5',
    },
    // Yesterday
    {
        id: 'sh-6',
        query: 'escritórios de advocacia',
        location: 'São Paulo, SP',
        timestamp: days(1),
        radiusKm: 3,
        types: ['Serviços'],
        additionalFilters: ['Com site', 'Com email'],
        resultsFound: 41,
        leadsCaptured: 9,
        sessionId: 'sess-6',
    },
    {
        id: 'sh-7',
        query: 'oficinas mecânicas',
        location: 'Santo André, SP',
        timestamp: new Date(days(1).getTime() - 2 * 3_600_000),
        radiusKm: 7,
        types: ['Automóveis'],
        additionalFilters: [],
        resultsFound: 28,
        leadsCaptured: 6,
        sessionId: 'sess-7',
    },
    {
        id: 'sh-8',
        query: 'cursos e escolas de idiomas',
        location: 'São Paulo, SP',
        timestamp: new Date(days(1).getTime() - 4 * 3_600_000),
        radiusKm: 10,
        types: ['Educação'],
        additionalFilters: ['Com site'],
        resultsFound: 33,
        leadsCaptured: 8,
        sessionId: 'sess-8',
    },
    {
        id: 'sh-9',
        query: 'farmácias e drogarias',
        location: 'Osasco, SP',
        timestamp: new Date(days(1).getTime() - 5 * 3_600_000),
        radiusKm: 5,
        types: ['Saúde'],
        additionalFilters: ['Com telefone'],
        resultsFound: 24,
        leadsCaptured: 5,
        sessionId: 'sess-9',
    },
    {
        id: 'sh-10',
        query: 'supermercados e mercadinhos',
        location: 'São Bernardo do Campo, SP',
        timestamp: new Date(days(1).getTime() - 7 * 3_600_000),
        radiusKm: 8,
        types: ['Varejo'],
        additionalFilters: [],
        resultsFound: 18,
        leadsCaptured: 3,
        sessionId: 'sess-10',
    },
    // Last week
    {
        id: 'sh-11',
        query: 'padarias e confeitarias',
        location: 'São Paulo, SP',
        timestamp: days(3),
        radiusKm: 6,
        types: ['Restaurante'],
        additionalFilters: ['Com avaliação ≥ 4.0'],
        resultsFound: 37,
        leadsCaptured: 9,
        sessionId: 'sess-11',
    },
    {
        id: 'sh-12',
        query: 'pet shops e veterinárias',
        location: 'São Paulo, SP',
        timestamp: days(4),
        radiusKm: 10,
        types: ['Saúde', 'Serviços'],
        additionalFilters: ['Com site', 'Com telefone'],
        resultsFound: 29,
        leadsCaptured: 7,
        sessionId: 'sess-12',
    },
    {
        id: 'sh-13',
        query: 'salões de beleza e barbearias',
        location: 'Mauá, SP',
        timestamp: days(5),
        radiusKm: 5,
        types: ['Serviços'],
        additionalFilters: [],
        resultsFound: 51,
        leadsCaptured: 14,
        sessionId: 'sess-13',
    },
    {
        id: 'sh-14',
        query: 'imobiliárias e corretores',
        location: 'São Paulo, SP',
        timestamp: days(6),
        radiusKm: 20,
        types: ['Serviços'],
        additionalFilters: ['Com site', 'Com avaliação ≥ 3.5'],
        resultsFound: 42,
        leadsCaptured: 10,
        sessionId: 'sess-14',
    },
    // Last 30 days
    {
        id: 'sh-15',
        query: 'açougues e churrascarias',
        location: 'São Paulo, SP',
        timestamp: days(10),
        radiusKm: 8,
        types: ['Restaurante', 'Varejo'],
        additionalFilters: [],
        resultsFound: 25,
        leadsCaptured: 6,
        sessionId: 'sess-15',
    },
    {
        id: 'sh-16',
        query: 'escolas de informática',
        location: 'Diadema, SP',
        timestamp: days(12),
        radiusKm: 10,
        types: ['Educação'],
        additionalFilters: ['Com site'],
        resultsFound: 16,
        leadsCaptured: 4,
        sessionId: 'sess-16',
    },
    {
        id: 'sh-17',
        query: 'clínicas de estética',
        location: 'São Paulo, SP',
        timestamp: days(15),
        radiusKm: 12,
        types: ['Saúde', 'Serviços'],
        additionalFilters: ['Com Instagram', 'Com avaliação ≥ 4.0'],
        resultsFound: 38,
        leadsCaptured: 11,
        sessionId: 'sess-17',
    },
    {
        id: 'sh-18',
        query: 'concessionárias de veículos',
        location: 'São Paulo, SP',
        timestamp: days(18),
        radiusKm: 25,
        types: ['Automóveis'],
        additionalFilters: ['Com site'],
        resultsFound: 21,
        leadsCaptured: 5,
        sessionId: 'sess-18',
    },
    {
        id: 'sh-19',
        query: 'postos de gasolina',
        location: 'São Paulo, SP',
        timestamp: days(20),
        radiusKm: 15,
        types: ['Automóveis'],
        additionalFilters: [],
        resultsFound: 32,
        leadsCaptured: 7,
        sessionId: 'sess-19',
    },
    {
        id: 'sh-20',
        query: 'clínicas de fisioterapia',
        location: 'São José dos Campos, SP',
        timestamp: days(22),
        radiusKm: 10,
        types: ['Saúde'],
        additionalFilters: ['Com telefone', 'Com email'],
        resultsFound: 17,
        leadsCaptured: 4,
        sessionId: 'sess-20',
    },
]

/** Group items by date category */
export type DateGroup = 'Hoje' | 'Ontem' | 'Última Semana' | 'Últimos 30 Dias'

export function getDateGroup(ts: Date): DateGroup {
    const now = new Date('2026-02-28T15:00:00')
    const diffH = (now.getTime() - ts.getTime()) / 3_600_000
    if (diffH < 24) return 'Hoje'
    if (diffH < 48) return 'Ontem'
    if (diffH < 168) return 'Última Semana'
    return 'Últimos 30 Dias'
}

/** Friendly relative time label */
export function relativeTime(ts: Date): string {
    const now = new Date('2026-02-28T15:00:00')
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
    const header = 'ID,Consulta,Local,Data/Hora,Raio (km),Tipos,Filtros,Resultados,Leads Capturados'
    const rows = items.map(i =>
        [
            i.id,
            `"${i.query}"`,
            `"${i.location}"`,
            i.timestamp.toLocaleString('pt-BR'),
            i.radiusKm,
            `"${i.types.join('; ')}"`,
            `"${i.additionalFilters.join('; ')}"`,
            i.resultsFound,
            i.leadsCaptured,
        ].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'historico-buscas.csv'
    a.click()
    URL.revokeObjectURL(url)
}
