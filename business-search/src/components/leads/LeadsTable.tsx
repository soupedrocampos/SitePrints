import React from 'react'
import { 
    MapPin, ShieldCheck, Star, 
    MoreHorizontal, TrendingUp, Building2,
    CheckCircle2, AlertCircle, Phone, Globe,
    ChevronRight, Navigation
} from 'lucide-react'
import type { Lead } from '../../types'
import { formatLocationWithFlag } from '../../utils/flags'

interface LeadsCardsProps {
    leads: Lead[]
}

export function LeadsCards({ leads }: LeadsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {leads.map((lead) => {
                const googleMapsUrl = lead.placesData?.placeId 
                    ? `https://www.google.com/maps/search/?api=1&query=google&query_place_id=${lead.placesData.placeId}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || lead.city}`)}`

                return (
                    <div 
                        key={lead.id}
                        className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 flex flex-col"
                    >
                        <div className="p-8 space-y-6 flex-1">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Score: {lead.quality}
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight tracking-tight">
                                    {lead.name}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    {formatLocationWithFlag(lead.city)}
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs font-bold">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    CNPJ: {lead.cnpj}
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs font-bold">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Capturado: {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <a 
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                                >
                                    <Navigation className="w-4 h-4" />
                                    Ver no Google Maps
                                </a>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="px-8 pb-8 pt-0 flex gap-3">
                            <button className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700">
                                Detalhes
                            </button>
                            <button className="flex-[1.5] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                                Enriquecer
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}
