/**
 * EnrichmentStatusBadge
 * Badge for CNPJ enrichment status: pending / completed / failed.
 * Shows animated pulse for pending, last enriched date on hover, retry for failed.
 */
import { useState } from 'react'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

export type EnrichmentStatus = 'pending' | 'completed' | 'failed'

interface BadgeConfig {
    label: string
    description: string
    icon: React.ReactNode
    className: string
    dotColor: string
    pulse: boolean
}

const CONFIG: Record<EnrichmentStatus, BadgeConfig> = {
    pending: {
        label: 'Pendente',
        description: 'Dados CNPJ ainda não foram enriquecidos.',
        icon: <Clock size={11} />,
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-400',
        pulse: true,
    },
    completed: {
        label: 'Enriquecido',
        description: 'Dados CNPJ enriquecidos com sucesso.',
        icon: <CheckCircle size={11} />,
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        pulse: false,
    },
    failed: {
        label: 'Falhou',
        description: 'Erro ao enriquecer dados CNPJ. Tente novamente.',
        icon: <XCircle size={11} />,
        className: 'bg-red-500/15 text-red-400 border-red-500/30',
        dotColor: 'bg-red-400',
        pulse: false,
    },
}

function formatDate(d: Date | string | undefined): string | null {
    if (!d) return null
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
    status: EnrichmentStatus
    lastEnriched?: Date | string
    onRetry?: () => void
    className?: string
}

export function EnrichmentStatusBadge({ status, lastEnriched, onRetry, className = '' }: Props) {
    const [showTooltip, setShowTooltip] = useState(false)
    const [retrying, setRetrying] = useState(false)
    const cfg = CONFIG[status]
    const dateStr = formatDate(lastEnriched)

    const handleRetry = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!onRetry || retrying) return
        setRetrying(true)
        await onRetry()
        setTimeout(() => setRetrying(false), 2000)
    }

    return (
        <div
            className={`relative inline-flex items-center gap-1.5 ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-medium ${cfg.className}`}>
                {/* Animated dot for pending */}
                {cfg.pulse && (
                    <span className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dotColor}`} />
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dotColor}`} />
                    </span>
                )}
                {cfg.icon}
                {cfg.label}
            </span>

            {/* Retry button (failed only) */}
            {status === 'failed' && onRetry && (
                <button
                    onClick={handleRetry}
                    title="Tentar novamente"
                    className={`p-1 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/15 transition-all ${retrying ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={11} />
                </button>
            )}

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full mb-2 left-0 z-50 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl min-w-max">
                        <p className="text-[11px] font-semibold text-white">{cfg.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{cfg.description}</p>
                        {dateStr && (
                            <p className="text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                                Último: {dateStr}
                            </p>
                        )}
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 ml-3 -mt-1" />
                </div>
            )}
        </div>
    )
}

export default EnrichmentStatusBadge
