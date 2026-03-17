/**
 * LeadStatusBadge
 * Color-coded badge for lead status with optional icon and tooltip.
 */
import { useState } from 'react'
import { Sparkles, Phone, Star, CheckCircle, XCircle, Circle } from 'lucide-react'

export type LeadStatus = 'novo' | 'contatado' | 'qualificado' | 'convertido' | 'rejeitado'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface StatusConfig {
    label: string
    description: string
    icon: React.ReactNode
    className: string
    dotColor: string
}

const CONFIG: Record<LeadStatus, StatusConfig> = {
    novo: {
        label: 'Novo',
        description: 'Lead recém-capturado, aguardando contato inicial.',
        icon: <Circle size={10} />,
        className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dotColor: 'bg-blue-400',
    },
    contatado: {
        label: 'Contatado',
        description: 'Primeiro contato realizado, aguardando retorno.',
        icon: <Phone size={10} />,
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotColor: 'bg-amber-400',
    },
    qualificado: {
        label: 'Qualificado',
        description: 'Lead analisado e confirmado como potencial cliente.',
        icon: <Star size={10} />,
        className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dotColor: 'bg-indigo-400',
    },
    convertido: {
        label: 'Convertido',
        description: 'Cliente conquistado — negócio fechado com sucesso!',
        icon: <CheckCircle size={10} />,
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
    },
    rejeitado: {
        label: 'Rejeitado',
        description: 'Lead descartado — não adequado ao perfil ou sem interesse.',
        icon: <XCircle size={10} />,
        className: 'bg-red-500/15 text-red-300 border-red-500/30',
        dotColor: 'bg-red-400',
    },
}

const SIZE_CLS: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
}

interface Props {
    status: LeadStatus
    size?: BadgeSize
    showIcon?: boolean
    className?: string
}

export function LeadStatusBadge({ status, size = 'md', showIcon = true, className = '' }: Props) {
    const [showTooltip, setShowTooltip] = useState(false)
    const cfg = CONFIG[status]

    return (
        <div className="relative inline-flex">
            <span
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`inline-flex items-center font-semibold rounded-full border cursor-default select-none
          ${cfg.className} ${SIZE_CLS[size]} ${className}`}
            >
                {showIcon && cfg.icon}
                {cfg.label}
            </span>

            {showTooltip && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                        <p className="text-[11px] font-semibold text-white mb-0.5">{cfg.label}</p>
                        <p className="text-[10px] text-slate-400 max-w-48 whitespace-normal">{cfg.description}</p>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
                </div>
            )}
        </div>
    )
}

export default LeadStatusBadge
