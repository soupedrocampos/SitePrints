import { Lead, LeadStatus } from '../types/lead'

export const STATUS_COLORS: Record<LeadStatus, string> = {
    Novo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Contatado: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Qualificado: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Convertido: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Rejeitado: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export const STATUS_DOT: Record<LeadStatus, string> = {
    Novo: 'bg-blue-400',
    Contatado: 'bg-yellow-400',
    Qualificado: 'bg-purple-400',
    Convertido: 'bg-emerald-400',
    Rejeitado: 'bg-red-400',
}

export function qualityColor(q: number) {
    if (q >= 75) return 'bg-emerald-500'
    if (q >= 50) return 'bg-yellow-500'
    if (q >= 25) return 'bg-orange-500'
    return 'bg-red-500'
}

export function maskCNPJ(cnpj: string) {
    return cnpj // already formatted as XX.XXX.XXX/XXXX-XX
}

export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
    })
}

export function exportToCSV(leads: Lead[]) {
    const header = ['Nome', 'CNPJ', 'Status', 'Fonte', 'Qualidade', 'Cidade', 'Estado', 'Criado em']
    const rows = leads.map((l) => [
        l.name, l.cnpj, l.status, l.source, l.quality, l.city, l.state, formatDate(l.created_at)
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
