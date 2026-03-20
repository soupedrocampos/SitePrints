import React, { useState } from 'react'
import { 
    X, Mail, Globe, Phone, MapPin, 
    Calendar, ShieldCheck, Star, ExternalLink,
    Building2, FileText, ChevronRight, Activity,
    TrendingUp, MessageSquare, Download, CheckCircle2,
    Briefcase, User, Info, Navigation
} from 'lucide-react'
import type { Lead } from '../../types'
import { formatLocationWithFlag } from '../../utils/flags'

interface LeadModalProps {
    lead: Lead
    onClose: () => void
}

export function LeadModal({ lead, onClose }: LeadModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'enrich' | 'activity'>('info')

    const googleMapsUrl = lead.placesData?.placeId 
        ? `https://www.google.com/maps/search/?api=1&query=google&query_place_id=${lead.placesData.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || lead.city}`)}`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full max-h-[900px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-500">
                {/* Modal Header */}
                <div className="relative p-8 md:p-12 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800">
                    <button 
                        onClick={onClose}
                        className="absolute right-8 top-8 p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 shadow-lg border border-slate-100 dark:border-slate-700"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                            <Building2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{lead.name}</h2>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    lead.status === 'Novo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    lead.status === 'Qualificado' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {lead.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 font-bold">
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-500" />
                                    {formatLocationWithFlag(`${lead.city}, ${lead.state}`)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                                    CNPJ: {lead.cnpj}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-amber-500" />
                                    Capturado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <a 
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all text-xs border border-indigo-100 dark:border-indigo-800/50"
                                >
                                    <Navigation className="w-4 h-4" />
                                    Ver no Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 bg-white dark:bg-slate-900">
                        {/* Tab Switcher */}
                        <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl w-fit">
                            {[
                                { id: 'info', label: 'Informações Gerais', icon: Info },
                                { id: 'enrich', label: 'Enriquecimento CNPJ', icon: Zap },
                                { id: 'activity', label: 'Atividades', icon: Activity }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-tight transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Detailed Info Card */}
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                        Dados de Contato
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 group hover:border-blue-500/30 transition-all">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Telefone Principal</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{lead.phone || 'Indisponível'}</span>
                                                <a href={`tel:${lead.phone}`} className="p-2 bg-white dark:bg-slate-700 text-blue-600 rounded-xl shadow-md"><Phone className="w-4 h-4" /></a>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 group hover:border-emerald-500/30 transition-all">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Website</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate mr-4">{lead.website || 'Não possui'}</span>
                                                {lead.website && <a href={lead.website} target="_blank" className="p-2 bg-white dark:bg-slate-700 text-emerald-600 rounded-xl shadow-md"><ExternalLink className="w-4 h-4" /></a>}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50 dark:border-slate-800/50 group hover:border-indigo-500/30 transition-all">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail Corporativo</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.email || 'Não mapeado'}</span>
                                                {lead.email && <a href={`mailto:${lead.email}`} className="p-2 bg-white dark:bg-slate-700 text-indigo-600 rounded-xl shadow-md"><Mail className="w-4 h-4" /></a>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scoring & Insights */}
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/20">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black tracking-tight">Lead Insights</h3>
                                        <TrendingUp className="w-6 h-6 opacity-60" />
                                    </div>
                                    
                                    <div className="flex items-end gap-3 mb-10">
                                        <span className="text-6xl font-black tracking-tight tabular-nums">{lead.quality}</span>
                                        <div className="space-y-0 text-indigo-100/60 font-black uppercase tracking-widest text-[10px] pb-2">
                                            <span>Score de</span><br/><span>Qualificação</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${lead.quality}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-indigo-100/40">
                                            <span>Fraco</span>
                                            <span>Potencial</span>
                                            <span>VGV Premium</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                   <div className="flex items-center gap-3 p-5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                                      <CheckCircle2 className="w-6 h-6" />
                                      <div>
                                         <p className="text-sm font-black uppercase tracking-tight">Oportunidade de VGV</p>
                                         <p className="text-xs font-bold opacity-80">Este lead atende aos critérios de nicho premium.</p>
                                      </div>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Notes & Sidebar */}
                    <div className="w-96 shrink-0 bg-slate-50 dark:bg-slate-950/40 border-l border-slate-200/60 dark:border-slate-800 p-10 flex flex-col space-y-10">
                        <div className="space-y-6 flex-1">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Bloco de Notas</h3>
                            <textarea 
                                placeholder="Adicione observações sobre este lead..."
                                className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-300 resize-none"
                            />
                        </div>

                        <div className="space-y-4">
                            <button className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                Salvar Alterações
                            </button>
                            <button className="w-full py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3">
                                <Download className="w-4 h-4" />
                                Relatório PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
