/**
 * SourceIcon
 * Colored icon badge indicating the origin of a lead.
 */
import { useState } from 'react'
import { Upload, PenLine } from 'lucide-react'

export type LeadSource = 'google_maps' | 'manual' | 'import'
type IconSize = 'xs' | 'sm' | 'md' | 'lg'

/* Inline Google Maps SVG (brand color) */
const GoogleMapsIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335" />
        <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
)

interface SourceConfig {
    label: string
    description: string
    bgClass: string
    borderClass: string
    icon: (iconPx: number) => React.ReactNode
}

const CONFIG: Record<LeadSource, SourceConfig> = {
    google_maps: {
        label: 'Google Maps',
        description: 'Lead capturado via busca no Google Maps / Google Places.',
        bgClass: 'bg-red-500/12',
        borderClass: 'border-red-500/25',
        icon: (px) => <GoogleMapsIcon size={px} />,
    },
    manual: {
        label: 'Manual',
        description: 'Lead adicionado manualmente via CNPJ ou formulário.',
        bgClass: 'bg-violet-500/15',
        borderClass: 'border-violet-500/30',
        icon: (px) => <PenLine size={px} className="text-violet-400" />,
    },
    import: {
        label: 'Importação',
        description: 'Lead importado via planilha CSV ou integração externa.',
        bgClass: 'bg-cyan-500/15',
        borderClass: 'border-cyan-500/30',
        icon: (px) => <Upload size={px} className="text-cyan-400" />,
    },
}

const SIZE_CONFIG: Record<IconSize, { wrapper: string; icon: number; text: string }> = {
    xs: { wrapper: 'w-5 h-5', icon: 11, text: 'text-[10px]' },
    sm: { wrapper: 'w-7 h-7', icon: 14, text: 'text-[11px]' },
    md: { wrapper: 'w-9 h-9', icon: 17, text: 'text-xs' },
    lg: { wrapper: 'w-12 h-12', icon: 22, text: 'text-sm' },
}

interface Props {
    source: LeadSource
    size?: IconSize
    showLabel?: boolean
    className?: string
}

export function SourceIcon({ source, size = 'sm', showLabel = false, className = '' }: Props) {
    const [showTooltip, setShowTooltip] = useState(false)
    const cfg = CONFIG[source]
    const sz = SIZE_CONFIG[size]

    return (
        <div
            className={`relative inline-flex items-center gap-1.5 ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Icon circle */}
            <div className={`${sz.wrapper} rounded-lg border flex items-center justify-center shrink-0 ${cfg.bgClass} ${cfg.borderClass}`}>
                {cfg.icon(sz.icon)}
            </div>

            {/* Optional label */}
            {showLabel && (
                <span className={`${sz.text} text-slate-400 font-medium`}>{cfg.label}</span>
            )}

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                        <p className="text-[11px] font-semibold text-white">{cfg.label}</p>
                        <p className="text-[10px] text-slate-400 max-w-52 whitespace-normal mt-0.5">{cfg.description}</p>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
                </div>
            )}
        </div>
    )
}

export default SourceIcon
