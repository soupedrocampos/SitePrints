/**
 * formatters.ts — Brazilian locale formatters for phone, CNPJ, currency, date, address.
 */

/* ─── CNPJ ──────────────────────────────── */
export function formatCNPJ(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 14)
    return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
}

export function unformatCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '')
}

/* ─── Phone ──────────────────────────────── */
export function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length === 11) {
        return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    }
    if (d.length === 10) {
        return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
    }
    return raw
}

/* ─── Currency ───────────────────────────── */
export function formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
}

/* ─── Numbers ────────────────────────────── */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
}

/* ─── Dates ──────────────────────────────── */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export function relativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    if (diff < 172800) return 'ontem'
    return formatDate(d)
}

/* ─── Address ────────────────────────────── */
export interface AddressParts {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zip?: string
}

export function formatAddress(parts: AddressParts): string {
    const segments: string[] = []
    if (parts.street) {
        segments.push(parts.number ? `${parts.street}, ${parts.number}` : parts.street)
    }
    if (parts.complement) segments.push(parts.complement)
    if (parts.neighborhood) segments.push(parts.neighborhood)

    const cityState = [parts.city, parts.state].filter(Boolean).join(' - ')
    if (cityState) segments.push(cityState)
    if (parts.zip) segments.push(formatZip(parts.zip))

    return segments.join(' · ')
}

export function formatZip(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8)
    return d.replace(/^(\d{5})(\d)/, '$1-$2')
}

/* ─── Text ────────────────────────────────── */
export function truncate(text: string, max: number): string {
    return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
