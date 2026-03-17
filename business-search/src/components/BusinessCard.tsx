import { Star, MapPin, Phone, ExternalLink, Globe } from 'lucide-react'
import { Business } from '../types/business'

interface BusinessCardProps {
    business: Business
    onCapture: (business: Business) => void
    isCaptured: boolean
}

const typeColors: Record<string, string> = {
    Restaurante: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Hotel: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Varejo: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Serviços: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Saúde: 'bg-green-500/20 text-green-300 border-green-500/30',
    Educação: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={13}
                    className={i <= Math.round(rating) ? 'star-filled fill-yellow-400' : 'star-empty'}
                />
            ))}
            <span className="text-xs text-slate-400 ml-1 font-medium">{rating.toFixed(1)}</span>
        </div>
    )
}

export default function BusinessCard({ business, onCapture, isCaptured }: BusinessCardProps) {
    const badgeClass = typeColors[business.type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'

    return (
        <div className="fade-in glass rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 group">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {business.name}
                </h3>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {business.type}
                </span>
            </div>

            {/* Rating */}
            {business.rating != null && <StarRating rating={business.rating} />}

            {/* Details */}
            <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 shrink-0 text-indigo-400" />
                    <span className="line-clamp-2">{business.address}</span>
                </div>
                {business.phone && (
                    <div className="flex items-center gap-1.5">
                        <Phone size={12} className="shrink-0 text-indigo-400" />
                        <span>{business.phone}</span>
                    </div>
                )}
            </div>

            {/* Site status */}
            {business.accessible != null && (
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${business.accessible ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-[11px] text-slate-500">
                        {business.accessible
                            ? `Site online · ${business.response_time?.toFixed(0)}ms`
                            : `Site offline · ${business.status_code ?? 'Timeout'}`}
                    </span>
                </div>
            )}

            {/* Actions & Links */}
            <div className="flex flex-col gap-2 mt-auto pt-1">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onCapture(business)}
                        className={`flex-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all duration-200 ${isCaptured
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-md hover:shadow-indigo-500/20 active:scale-95'
                            }`}
                    >
                        {isCaptured ? '✓ Lead Capturado' : 'Capturar Lead'}
                    </button>
                    {business.website && (
                        <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 transition-all duration-200"
                            title="Abrir website principal"
                        >
                            {business.accessible ? <ExternalLink size={14} /> : <Globe size={14} />}
                        </a>
                    )}
                </div>

                {/* Additional Links */}
                {business.links && business.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/50 mt-1">
                        {business.links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 text-[10px] text-slate-400 hover:text-cyan-300 transition-all duration-200 bg-slate-800/30"
                                title={link.url}
                            >
                                <Globe size={10} className="text-cyan-500/70" />
                                <span>{link.label}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
