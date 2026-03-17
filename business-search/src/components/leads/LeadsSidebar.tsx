import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Lead, LeadFilters, LeadStatus, LeadSource } from '../../types/lead'
import { STATUS_COLORS } from '../../lib/leadHelpers'

const ALL_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Convertido', 'Rejeitado']
const ALL_SOURCES: LeadSource[] = ['Google Maps', 'Manual', 'Import']

interface LeadsSidebarProps {
    leads: Lead[]
    filters: LeadFilters
    onChange: (filters: LeadFilters) => void
}

export default function LeadsSidebar({ leads, filters, onChange }: LeadsSidebarProps) {
    const [collapsed, setCollapsed] = useState(false)

    const statusCount = (s: LeadStatus) => leads.filter((l) => l.status === s).length

    const toggleStatus = (s: LeadStatus) => {
        const statuses = filters.statuses.includes(s)
            ? filters.statuses.filter((x) => x !== s)
            : [...filters.statuses, s]
        onChange({ ...filters, statuses })
    }

    const toggleSource = (src: LeadSource) => {
        const sources = filters.sources.includes(src)
            ? filters.sources.filter((x) => x !== src)
            : [...filters.sources, src]
        onChange({ ...filters, sources })
    }

    const clearFilters = () =>
        onChange({
            search: '', statuses: [], sources: [],
            dateFrom: '', dateTo: '', enriched: null,
            qualityMin: 0, qualityMax: 100,
            onlyWithWebsite: false,
        })

    const hasFilters =
        filters.statuses.length > 0 || filters.sources.length > 0 ||
        filters.dateFrom || filters.dateTo || filters.enriched !== null ||
        filters.qualityMin > 0 || filters.qualityMax < 100 || filters.onlyWithWebsite

    return (
        <aside className="glass rounded-2xl p-4 flex flex-col gap-4 h-fit sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-white">Filtros</span>
                    {hasFilters && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                </div>
                <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-white">
                    {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>

            {!collapsed && (
                <>
                    {/* Status Filter */}
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Status</p>
                        <div className="flex flex-col gap-1">
                            {ALL_STATUSES.map((s) => {
                                const active = filters.statuses.includes(s)
                                return (
                                    <button
                                        key={s}
                                        onClick={() => toggleStatus(s)}
                                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${active
                                            ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[s].split(' ')[0].replace('bg-', 'bg-').replace('/20', '/80')}`} />
                                            {s}
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[s]}`}>
                                            {statusCount(s)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Source Filter */}
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Fonte</p>
                        <div className="flex flex-col gap-1.5">
                            {ALL_SOURCES.map((src) => (
                                <label key={src} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.sources.includes(src)}
                                        onChange={() => toggleSource(src)}
                                        className="w-3.5 h-3.5 accent-indigo-500 rounded"
                                    />
                                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{src}</span>
                                </label>
                            ))}
                            <div className="h-2" />
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.onlyWithWebsite}
                                    onChange={(e) => onChange({ ...filters, onlyWithWebsite: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                                />
                                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Mostrar apenas com site</span>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Date Range */}
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Data de Criação</p>
                        <div className="flex flex-col gap-2">
                            <div>
                                <label className="text-[10px] text-slate-600 mb-1 block">De</label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-600 mb-1 block">Até</label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/70"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Enrichment Toggle */}
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Enriquecimento</p>
                        <div className="flex gap-2">
                            {[{ v: true, label: 'Enriquecido' }, { v: false, label: 'Pendente' }, { v: null, label: 'Todos' }].map(({ v, label }) => (
                                <button
                                    key={label}
                                    onClick={() => onChange({ ...filters, enriched: v })}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${filters.enriched === v
                                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                                        : 'border-slate-700 text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Quality Score Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Score de Qualidade</p>
                            <span className="text-[10px] text-indigo-400">{filters.qualityMin}–{filters.qualityMax}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <input
                                type="range" min={0} max={100} value={filters.qualityMin}
                                style={{ '--value': `${filters.qualityMin}%` } as React.CSSProperties}
                                onChange={(e) => {
                                    const v = Number(e.target.value)
                                    onChange({ ...filters, qualityMin: Math.min(v, filters.qualityMax - 1) })
                                }}
                            />
                            <input
                                type="range" min={0} max={100} value={filters.qualityMax}
                                style={{ '--value': `${filters.qualityMax}%` } as React.CSSProperties}
                                onChange={(e) => {
                                    const v = Number(e.target.value)
                                    onChange({ ...filters, qualityMax: Math.max(v, filters.qualityMin + 1) })
                                }}
                            />
                        </div>
                    </div>

                    {/* Clear */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all"
                        >
                            <X size={12} />
                            Limpar Filtros
                        </button>
                    )}
                </>
            )}
        </aside>
    )
}
