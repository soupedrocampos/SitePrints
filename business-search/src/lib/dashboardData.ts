/**
 * Mock data for the Dashboard page.
 * In production, replace with real API calls.
 */

export type DateRange = 'today' | '7d' | '30d' | 'custom'

/* ── KPI snapshots per date range ─────────────────────── */
export interface KPIData {
    totalLeads: number
    totalLeadsDelta: number // %
    conversionRate: number
    conversionTarget: number
    activeLeads: number
    statusBreakdown: Record<string, number>
    avgQuality: number
    qualityDist: number[] // buckets 0-20,20-40,40-60,60-80,80-100
}

const KPI_BY_RANGE: Record<DateRange, KPIData> = {
    today: {
        totalLeads: 14, totalLeadsDelta: 8,
        conversionRate: 21, conversionTarget: 25,
        activeLeads: 9,
        statusBreakdown: { Novo: 5, Contatado: 3, Qualificado: 1, Convertido: 0, Rejeitado: 5 },
        avgQuality: 68,
        qualityDist: [1, 2, 3, 4, 4],
    },
    '7d': {
        totalLeads: 87, totalLeadsDelta: 12,
        conversionRate: 24, conversionTarget: 25,
        activeLeads: 61,
        statusBreakdown: { Novo: 28, Contatado: 19, Qualificado: 14, Convertido: 9, Rejeitado: 17 },
        avgQuality: 72,
        qualityDist: [4, 12, 22, 31, 18],
    },
    '30d': {
        totalLeads: 342, totalLeadsDelta: 18,
        conversionRate: 27, conversionTarget: 30,
        activeLeads: 221,
        statusBreakdown: { Novo: 89, Contatado: 74, Qualificado: 58, Convertido: 48, Rejeitado: 73 },
        avgQuality: 74,
        qualityDist: [18, 42, 88, 121, 73],
    },
    custom: {
        totalLeads: 156, totalLeadsDelta: 5,
        conversionRate: 22, conversionTarget: 25,
        activeLeads: 102,
        statusBreakdown: { Novo: 41, Contatado: 33, Qualificado: 28, Convertido: 22, Rejeitado: 32 },
        avgQuality: 71,
        qualityDist: [8, 20, 40, 55, 33],
    },
}

/* ── Status chart (donut) ────────────────────────────── */
export function getStatusChart(range: DateRange) {
    const sb = KPI_BY_RANGE[range].statusBreakdown
    const colors: Record<string, string> = {
        Novo: '#6366f1', Contatado: '#3b82f6', Qualificado: '#10b981',
        Convertido: '#f59e0b', Rejeitado: '#ef4444',
    }
    return Object.entries(sb).map(([name, value]) => ({ name, value, fill: colors[name] ?? '#64748b' }))
}

/* ── Source bar chart ────────────────────────────────── */
export function getSourceChart(range: DateRange) {
    const mul = { today: 1, '7d': 6, '30d': 24, custom: 11 }[range]
    return [
        { source: 'Google Maps', value: 8 * mul, fill: '#6366f1' },
        { source: 'Manual', value: 3 * mul, fill: '#10b981' },
        { source: 'Import', value: 2 * mul, fill: '#f59e0b' },
    ]
}

/* ── Activity timeline ───────────────────────────────── */
export type ActivityType = 'note' | 'call' | 'email' | 'status' | 'enrich'
export interface TimelineActivity {
    id: string
    type: ActivityType
    company: string
    description: string
    time: string
    date: string
    user: string
    userInitials: string
    userColor: string
}

export const TIMELINE: TimelineActivity[] = [
    { id: '1', type: 'status', company: 'Tech Solutions Brasil', description: 'Status alterado para Qualificado', time: '11:43', date: 'Hoje', user: 'Carlos M.', userInitials: 'CM', userColor: 'bg-indigo-500' },
    { id: '2', type: 'note', company: 'Bella Napoli Pizzaria', description: 'Ligou para confirmar interesse na proposta', time: '10:22', date: 'Hoje', user: 'Ana P.', userInitials: 'AP', userColor: 'bg-emerald-500' },
    { id: '3', type: 'enrich', company: 'Drogaria Saúde e Vida', description: 'Dados CNPJ enriquecidos com sucesso', time: '09:55', date: 'Hoje', user: 'Sistema', userInitials: 'SI', userColor: 'bg-slate-600' },
    { id: '4', type: 'call', company: 'Construções ABC Ltda', description: 'Reunião agendada para 05/03', time: '09:10', date: 'Hoje', user: 'Carlos M.', userInitials: 'CM', userColor: 'bg-indigo-500' },
    { id: '5', type: 'email', company: 'Farmácia Central SP', description: 'Proposta comercial enviada por e-mail', time: '18:30', date: 'Ontem', user: 'Ana P.', userInitials: 'AP', userColor: 'bg-emerald-500' },
    { id: '6', type: 'status', company: 'Padaria Pão da Serra', description: 'Status alterado para Rejeitado', time: '17:12', date: 'Ontem', user: 'Carlos M.', userInitials: 'CM', userColor: 'bg-indigo-500' },
    { id: '7', type: 'note', company: 'Auto Peças Rio Sul', description: 'Cliente solicitou prazo de 30 dias', time: '16:48', date: 'Ontem', user: 'Lucas R.', userInitials: 'LR', userColor: 'bg-purple-500' },
    { id: '8', type: 'enrich', company: 'Clínica Santa Luzia', description: 'Enriquecimento com dados Places concluído', time: '14:30', date: 'Ontem', user: 'Sistema', userInitials: 'SI', userColor: 'bg-slate-600' },
    { id: '9', type: 'call', company: 'Oficina Mecânica Veloso', description: 'Primeiro contato — aguardando retorno', time: '11:05', date: 'Ontem', user: 'Lucas R.', userInitials: 'LR', userColor: 'bg-purple-500' },
    { id: '10', type: 'email', company: 'Supermercado Bom Preço', description: 'Follow-up da proposta de março', time: '08:20', date: 'Ontem', user: 'Ana P.', userInitials: 'AP', userColor: 'bg-emerald-500' },
]

/* ── Top quality leads ───────────────────────────────── */
export interface TopLead {
    id: string
    name: string
    cnpj: string
    quality: number
    status: string
    statusColor: string
}

export const TOP_LEADS: TopLead[] = [
    { id: 'lead-7', name: 'Tech Solutions Brasil Ltda', cnpj: '33.222.111/0001-44', quality: 95, status: 'Qualificado', statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { id: 'lead-1', name: 'Bella Napoli Pizzaria', cnpj: '11.222.333/0001-81', quality: 91, status: 'Contatado', statusColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    { id: 'lead-12', name: 'Clínica Odonto Smile Ltda', cnpj: '77.321.654/0001-88', quality: 88, status: 'Novo', statusColor: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
    { id: 'lead-4', name: 'Construções ABC Empreendimentos', cnpj: '22.111.444/0001-77', quality: 84, status: 'Qualificado', statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { id: 'lead-19', name: 'Academia FitLife Unidade 3', cnpj: '44.333.222/0001-55', quality: 82, status: 'Convertido', statusColor: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
]

/* ── Enrichment stats ────────────────────────────────── */
export function getEnrichmentStats(range: DateRange) {
    const muls = { today: 0.2, '7d': 1, '30d': 4, custom: 2 }
    const m = muls[range]
    return {
        successRate: 87,
        avgTimeSeconds: 4.2,
        pending: Math.round(14 * m),
        enriched: Math.round(61 * m),
        failed: Math.round(9 * m),
    }
}

/* ── Search performance line chart ──────────────────── */
export function getSearchTimeline(range: DateRange) {
    const days = range === 'today' ? 24 : range === '7d' ? 7 : 30
    const labels = range === 'today'
        ? Array.from({ length: 24 }, (_, i) => `${i}h`)
        : Array.from({ length: days }, (_, i) => {
            const d = new Date('2026-02-28')
            d.setDate(d.getDate() - (days - 1 - i))
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
        })

    const base = range === 'today' ? 3 : range === '7d' ? 24 : 11
    return labels.map((label, i) => ({
        label,
        searches: Math.max(0, base + Math.round(Math.sin(i * 0.8) * base * 0.6 + Math.random() * base * 0.3)),
        leads: Math.max(0, Math.round((base + Math.round(Math.sin(i * 0.8) * base * 0.4)) * 0.28 + Math.random() * 2)),
    }))
}

export function getKPI(range: DateRange) { return KPI_BY_RANGE[range] }
