import React, { useState } from 'react'
import { 
    MapPin, Globe, Phone, Star, Plus, 
    ExternalLink, Check, ShieldCheck,
    Navigation
} from 'lucide-react'
import type { Business } from '../types'
import { leadsService } from '../services/leads'
import { formatLocationWithFlag } from '../utils/flags'

interface BusinessCardProps {
    business: Business
    sessionId?: string
}

export function BusinessCard({ business, sessionId }: BusinessCardProps) {
    const [isCaptured, setIsCaptured] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)

    const handleCapture = async () => {
        setIsCapturing(true)
        try {
            // Determine source
            const source = business.source === 'Raspador Gratuito' ? 'Import' : 'Google Maps'
            
            await leadsService.createLead({
                companyName: business.name,
                cnpj: 'Pendente',
                website: business.website || undefined,
                phone: business.phone || undefined,
                address: business.address,
                city: business.city || '',
                state: business.state || '',
                source: source as any,
                sessionId: sessionId
            })
            setIsCaptured(true)
        } catch (error) {
            console.error('Capture error:', error)
        } finally {
            setIsCapturing(false)
        }
    }

    const googleMapsUrl = business.place_id 
        ? `https://www.google.com/maps/search/?api=1&query=google&query_place_id=${business.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`

    return (
        <div className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 flex flex-col h-full">
            <div className="p-6 sm:p-8 space-y-6 flex-1">
                {/* Header: Name and Rating */}
                <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {business.name}
                        </h3>
                        {business.rating && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-black text-amber-700 dark:text-amber-400 tabular-nums">{business.rating}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{business.type}</span>
                        {business.source && (
                           <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {business.source}
                           </span>
                        )}
                    </div>
                </div>

                {/* Details List */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 group/info">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-indigo-500 transition-colors">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">
                            {formatLocationWithFlag(business.address)}
                        </span>
                    </div>

                    {business.phone && (
                        <div className="flex items-center gap-3 group/info">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-blue-500 transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{business.phone}</span>
                        </div>
                    )}

                    {business.website && (
                        <div className="flex items-center gap-3 group/info">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover/info:text-emerald-500 transition-colors">
                                <Globe className="w-4 h-4" />
                            </div>
                            <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                            >
                                {business.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 sm:p-8 pt-0 flex gap-3">
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all hover:border-indigo-500 hover:text-indigo-600 shadow-sm active:scale-95 group/btn"
                >
                    <Navigation className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                    Ver no Maps
                </a>

                {isCaptured ? (
                    <div className="flex-[1.5] flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-50 content-dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-bold border border-emerald-200 dark:border-emerald-800/50 animate-in zoom-in-95 duration-300">
                        <Check className="w-5 h-5" />
                        Capturado
                    </div>
                ) : (
                    <button
                        onClick={handleCapture}
                        disabled={isCapturing}
                        className="flex-[1.5] px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                    >
                        {isCapturing ? (
                           <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                           <>
                              <Plus className="w-4 h-4" />
                              Capturar Lead
                           </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
