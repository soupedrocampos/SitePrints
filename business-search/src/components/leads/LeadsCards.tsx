import { Eye, Pencil, Trash2, MapPin } from 'lucide-react'
import { Lead } from '../../types/lead'
import { STATUS_COLORS, qualityColor, maskCNPJ } from '../../lib/leadHelpers'

const SOURCE_ICONS: Record<string, string> = {
    'Google Maps': '🗺️', 'Manual': '✏️', 'Import': '📥',
}

interface LeadsCardsProps {
    leads: Lead[]
    totalLeads?: number
    onView: (lead: Lead) => void
    onEdit: (lead: Lead) => void
    onDelete: (id: string) => void
    page: number
    perPage: number
}

export default function LeadsCards({ leads, totalLeads, onView, onEdit, onDelete, page, perPage }: LeadsCardsProps) {
    const paginated = leads

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {paginated.map((lead) => (
                <div key={lead.id} className="glass rounded-2xl p-4 flex flex-col gap-3 fade-in hover:border-indigo-500/30 transition-all group">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{SOURCE_ICONS[lead.source]}</span>
                            <div>
                                <p className="text-xs font-semibold text-white leading-tight line-clamp-1">{lead.name}</p>
                                <p className="text-[10px] text-slate-500">
                                    {lead.source === 'Google Maps' && lead.website 
                                        ? lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
                                        : lead.source}
                                </p>
                            </div>
                        </div>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[lead.status]}`}>
                            {lead.status}
                        </span>
                    </div>

                    {/* CNPJ */}
                    <p className="font-mono text-[11px] text-slate-500">{maskCNPJ(lead.cnpj)}</p>

                    {/* Quality bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${qualityColor(lead.quality)}`} style={{ width: `${lead.quality}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 w-8 text-right">{lead.quality}/100</span>
                    </div>

                    {/* City + enriched */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-slate-600" />
                            <span className="text-[11px] text-slate-400">{lead.city}, {lead.state}</span>
                        </div>
                        {lead.enriched && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                                ✦ Enriquecido
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onView(lead)} className="flex-1 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 transition-all">
                            <Eye size={12} className="mx-auto" />
                        </button>
                        <button onClick={() => onEdit(lead)} className="flex-1 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                            <Pencil size={12} className="mx-auto" />
                        </button>
                        <button onClick={() => onDelete(lead.id)} className="flex-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                            <Trash2 size={12} className="mx-auto" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
