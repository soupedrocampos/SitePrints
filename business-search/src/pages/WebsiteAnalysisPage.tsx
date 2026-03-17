import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import axios from 'axios'
import {
    Search, MapPin, Play, X, ExternalLink, Star, ShieldCheck, ShieldAlert,
    ShieldOff, ShieldX, CheckCircle2, AlertTriangle, XCircle, Globe,
    SlidersHorizontal, Download, RefreshCw, Mail, ChevronUp, ChevronDown,
    Eye, Maximize2, MoreVertical, Wifi, WifiOff, Loader2, MonitorSmartphone,
    Image as ImageIcon, Clock, Activity, BarChart3, Filter, Zap
} from 'lucide-react'
import {
    mockWebsiteAnalysis, getAnalysisSummary,
    type SiteAnalysis, type SiteStatus
} from '../lib/websiteAnalysisData'

/* ─── Types ────────────────────────── */
type SortKey = 'status' | 'responseTime' | 'quality' | 'name'
type SortDir = 'asc' | 'desc'

interface Filters {
    statusFilter: SiteStatus[]
    maxResponseTime: number
    hasSSL: boolean | null
    mobileOnly: boolean | null
    search: string
}

/* ─── Helpers ──────────────────────── */
function statusConfig(status: SiteStatus) {
    switch (status) {
        case 'ok': return { label: 'OK', icon: <CheckCircle2 size={12} />, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
        case 'warning': return { label: 'Aviso', icon: <AlertTriangle size={12} />, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
        case 'error': return { label: 'Erro', icon: <XCircle size={12} />, cls: 'bg-red-500/15 text-red-400 border-red-500/30' }
        case 'ssl_issue': return { label: 'SSL', icon: <ShieldAlert size={12} />, cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' }
    }
}

function responseTimeConfig(ms: number | null) {
    if (ms === null) return { label: 'Timeout', cls: 'text-red-400' }
    if (ms < 1000) return { label: `${ms}ms`, cls: 'text-emerald-400' }
    if (ms < 3000) return { label: `${(ms / 1000).toFixed(1)}s`, cls: 'text-amber-400' }
    return { label: `${(ms / 1000).toFixed(1)}s`, cls: 'text-red-400' }
}

function sslConfig(ssl: SiteAnalysis['ssl']) {
    switch (ssl) {
        case 'valid': return { icon: <ShieldCheck size={13} className="text-emerald-400" />, label: 'SSL válido' }
        case 'expired': return { icon: <ShieldX size={13} className="text-red-400" />, label: 'SSL expirado' }
        case 'warning': return { icon: <ShieldAlert size={13} className="text-amber-400" />, label: 'SSL aviso' }
        case 'missing': return { icon: <ShieldOff size={13} className="text-slate-500" />, label: 'Sem SSL' }
    }
}

function qualityColor(score: number) {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 55) return 'text-amber-400'
    return 'text-red-400'
}

function qualityBarColor(score: number) {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 55) return 'bg-amber-500'
    return 'bg-red-500'
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={11} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-700'} />
            ))}
            <span className="text-[11px] text-slate-500 ml-1">{rating.toFixed(1)}</span>
        </div>
    )
}

/* ─── Screenshot Image with lazy + skeleton ─── */
function ScreenshotImage({ src, alt, onClick }: { src: string | null; alt: string; onClick: () => void }) {
    const [loaded, setLoaded] = useState(false)
    const [errored, setErrored] = useState(false)

    if (!src || errored) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/50">
                <ImageIcon size={28} className="text-slate-700" />
                <span className="text-[11px] text-slate-600">{src ? 'Erro ao carregar' : 'Screenshot indisponível'}</span>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full cursor-zoom-in group" onClick={onClick}>
            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 to-slate-900" />
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
                className={`w-full h-full object-cover object-top transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-black/60 rounded-full p-2">
                    <Maximize2 size={16} className="text-white" />
                </div>
            </div>
        </div>
    )
}

/* ─── Screenshot Modal ─────────────────── */
function ScreenshotModal({ site, onClose }: { site: SiteAnalysis; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-white">{site.businessName}</span>
                        <a href={site.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            {site.website} <ExternalLink size={11} />
                        </a>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                {/* Screenshot */}
                <div className="relative aspect-video bg-slate-950">
                    {site.screenshotUrl ? (
                        <img src={site.screenshotUrl} alt={site.businessName} className="w-full h-full object-contain" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600">
                            <ImageIcon size={48} />
                            <p className="text-sm">{site.screenshotError ?? 'Screenshot indisponível'}</p>
                        </div>
                    )}
                </div>
                {/* Footer bar */}
                <div className="px-4 py-3 flex items-center gap-4 border-t border-slate-700 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(site.screenshotTimestamp).toLocaleString('pt-BR')}</span>
                    {site.responseTime && <span className={`flex items-center gap-1 ${responseTimeConfig(site.responseTime).cls}`}><Zap size={11} /> {responseTimeConfig(site.responseTime).label}</span>}
                    <span className="flex items-center gap-1">{sslConfig(site.ssl).icon} {sslConfig(site.ssl).label}</span>
                </div>
            </div>
        </div>
    )
}

/* ─── Single Analysis Card ─────────────── */
function SiteAnalysisCard({ site, onSelect, onExpand }: {
    site: SiteAnalysis
    onSelect: (id: string) => void
    onExpand: (site: SiteAnalysis) => void
}) {
    const st = statusConfig(site.status)
    const rt = responseTimeConfig(site.responseTime)
    const ssl = sslConfig(site.ssl)
    const hasQuality = site.quality.aestheticScore > 0

    return (
        <div className={`glass rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 border ${site.selected ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-700/50'}`}>
            {/* Screenshot */}
            <div className="relative h-44 bg-slate-900 flex-shrink-0 overflow-hidden">
                <ScreenshotImage src={site.screenshotUrl} alt={site.businessName} onClick={() => onExpand(site)} />

                {/* Status badge top-left */}
                <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${st.cls}`}>
                    {st.icon} {st.label}
                </div>

                {/* HTTP code top-right */}
                {site.statusCode && (
                    <div className="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-slate-300">
                        {site.statusCode}
                    </div>
                )}

                {/* Checkbox bottom-left */}
                <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onSelect(site.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${site.selected ? 'bg-indigo-600 border-indigo-500' : 'bg-black/60 border-slate-500'}`}
                    >
                        {site.selected && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                </div>

                {/* Timestamp */}
                <div className="absolute bottom-2.5 right-2.5 text-[9px] text-slate-500 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    {new Date(site.screenshotTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Business name + URL */}
                <div>
                    <h3 className="text-sm font-semibold text-white leading-snug truncate">{site.businessName}</h3>
                    <a href={site.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5 truncate">
                        <Globe size={10} className="shrink-0" />
                        <span className="truncate">{site.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={9} className="shrink-0" />
                    </a>
                    <div className="mt-1.5 flex items-center gap-2 justify-between">
                        <Stars rating={site.rating} />
                        <span className="text-[10px] text-slate-600">{site.ratingCount} avaliações</span>
                    </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2">
                    {/* Response time */}
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <Zap size={11} className={`mx-auto mb-0.5 ${rt.cls}`} />
                        <p className={`text-[11px] font-bold ${rt.cls}`}>{rt.label}</p>
                        <p className="text-[9px] text-slate-600">Resposta</p>
                    </div>
                    {/* SSL */}
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        {ssl.icon && <div className="flex justify-center mb-0.5">{ssl.icon}</div>}
                        <p className="text-[11px] font-bold text-slate-300">
                            {site.ssl === 'valid' ? 'Válido' : site.ssl === 'expired' ? 'Expirado' : site.ssl === 'missing' ? 'Ausente' : 'Aviso'}
                        </p>
                        <p className="text-[9px] text-slate-600">SSL</p>
                    </div>
                    {/* Redirects */}
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <Activity size={11} className={`mx-auto mb-0.5 ${site.redirectCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                        <p className={`text-[11px] font-bold ${site.redirectCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{site.redirectCount}</p>
                        <p className="text-[9px] text-slate-600">Redirecionamentos</p>
                    </div>
                </div>

                {/* Quality score */}
                {hasQuality ? (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-slate-400 font-medium">Qualidade Visual</span>
                            <span className={`text-[13px] font-bold ${qualityColor(site.quality.aestheticScore)}`}>
                                {site.quality.aestheticScore}/100
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${qualityBarColor(site.quality.aestheticScore)}`}
                                style={{ width: `${site.quality.aestheticScore}%` }}
                            />
                        </div>
                        {/* Sub-scores */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] flex items-center gap-1 ${site.quality.mobileScore >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                                <MonitorSmartphone size={10} />
                                Mobile {site.quality.mobileScore >= 70 ? 'OK' : 'Ruim'}
                            </span>
                            {site.quality.brokenImages > 0 && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                    <ImageIcon size={10} /> {site.quality.brokenImages} imgs quebradas
                                </span>
                            )}
                            {!site.quality.hasMetaDescription && (
                                <span className="text-[10px] text-slate-600 flex items-center gap-1">sem meta</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-800/40 rounded-xl p-2.5">
                        <AlertTriangle size={13} className="text-red-400/70" />
                        {site.screenshotError ?? 'Site inacessível — análise de qualidade indisponível'}
                    </div>
                )}

                {/* Ver Detalhes */}
                <button
                    onClick={() => onExpand(site)}
                    className="mt-auto w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                >
                    <Eye size={13} /> Ver Detalhes
                </button>
            </div>
        </div>
    )
}

/* ─── Filter Sidebar ───────────────── */
function FilterSidebar({
    filters, onChange, onReset, counts
}: {
    filters: Filters
    onChange: (f: Partial<Filters>) => void
    onReset: () => void
    counts: Record<SiteStatus, number>
}) {
    const statuses: { key: SiteStatus; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'ok', label: 'OK', icon: <CheckCircle2 size={13} className="text-emerald-400" />, count: counts.ok },
        { key: 'warning', label: 'Aviso', icon: <AlertTriangle size={13} className="text-amber-400" />, count: counts.warning },
        { key: 'error', label: 'Erro', icon: <XCircle size={13} className="text-red-400" />, count: counts.error },
        { key: 'ssl_issue', label: 'SSL', icon: <ShieldAlert size={13} className="text-orange-400" />, count: counts.ssl_issue },
    ]

    return (
        <aside className="w-60 shrink-0 flex flex-col gap-4">
            {/* Status */}
            <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Filter size={12} /> Status</h3>
                    {filters.statusFilter.length > 0 && (
                        <button onClick={() => onChange({ statusFilter: [] })} className="text-[10px] text-slate-500 hover:text-slate-300">Limpar</button>
                    )}
                </div>
                {statuses.map(({ key, label, icon, count }) => {
                    const active = filters.statusFilter.includes(key)
                    return (
                        <button key={key} onClick={() => {
                            const next = active
                                ? filters.statusFilter.filter(s => s !== key)
                                : [...filters.statusFilter, key]
                            onChange({ statusFilter: next })
                        }} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all mb-1 last:mb-0 ${active ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50'
                            }`}>
                            {icon}
                            <span className="flex-1 text-left text-xs">{label}</span>
                            <span className="text-[11px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Response time */}
            <div className="glass rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5"><Clock size={12} /> Tempo máx.</h3>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>0ms</span>
                    <span className="text-indigo-400 font-medium">{filters.maxResponseTime >= 10000 ? 'Qualquer' : `${(filters.maxResponseTime / 1000).toFixed(0)}s`}</span>
                    <span>∞</span>
                </div>
                <input type="range" min={1000} max={10000} step={500}
                    value={filters.maxResponseTime}
                    onChange={e => onChange({ maxResponseTime: Number(e.target.value) })}
                    style={{ '--value': `${((filters.maxResponseTime - 1000) / 9000) * 100}%` } as React.CSSProperties}
                    className="w-full"
                />
            </div>

            {/* Toggles */}
            <div className="glass rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><SlidersHorizontal size={12} /> Filtros</h3>

                {([
                    { key: 'hasSSL', icon: <ShieldCheck size={13} />, label: 'Com SSL válido' },
                    { key: 'mobileOnly', icon: <MonitorSmartphone size={13} />, label: 'Mobile friendly' },
                ] as const).map(({ key, icon, label }) => {
                    const val = filters[key]
                    return (
                        <button key={key} onClick={() => onChange({ [key]: val === true ? null : true })}
                            className={`flex items-center gap-2 text-xs transition-colors ${val ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${val ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="flex items-center gap-1">{icon} {label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Reset */}
            <button onClick={onReset} className="text-xs text-slate-600 hover:text-slate-400 transition-colors py-1">
                Limpar todos os filtros
            </button>
        </aside>
    )
}

/* ─── Analysis Progress ─────────────── */
function AnalysisProgress({ current, total, business }: { current: number; total: number; business: string }) {
    const pct = Math.round((current / total) * 100)
    return (
        <div className="glass rounded-2xl p-5 border border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Loader2 size={18} className="text-indigo-400 animate-spin" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">Analisando sites...</p>
                    <p className="text-xs text-slate-500">{current} de {total} sites concluídos</p>
                </div>
                <span className="ml-auto text-lg font-bold text-indigo-400">{pct}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            {/* Current business */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe size={12} className="text-indigo-400 animate-pulse" />
                <span>Analisando: <span className="text-slate-300">{business}</span></span>
            </div>
        </div>
    )
}

/* ─── Bulk Actions Bar ──────────────── */
function BulkActionsBar({ selected, onReanalyze, onExport, onEmail, onClearSelection }: {
    selected: number
    onReanalyze: () => void
    onExport: () => void
    onEmail: () => void
    onClearSelection: () => void
}) {
    if (selected === 0) return null
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 shadow-2xl shadow-black/40 backdrop-blur">
            <span className="text-sm font-semibold text-white">{selected} site{selected > 1 ? 's' : ''} selecionado{selected > 1 ? 's' : ''}</span>
            <div className="w-px h-4 bg-slate-700" />
            <button onClick={onReanalyze} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <RefreshCw size={13} /> Re-analisar
            </button>
            <button onClick={onExport} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <Download size={13} /> Exportar
            </button>
            <button onClick={onEmail} className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <Mail size={13} /> Enviar relatório
            </button>
            <button onClick={onClearSelection} className="text-slate-600 hover:text-slate-400 ml-1">
                <X size={16} />
            </button>
        </div>
    )
}

/* ─── Empty State ───────────────────── */
function EmptyIllustration() {
    return (
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            <rect x="10" y="20" width="100" height="70" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <rect x="10" y="20" width="100" height="18" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="24" cy="29" r="4" fill="#ef4444" fillOpacity="0.5" />
            <circle cx="38" cy="29" r="4" fill="#f59e0b" fillOpacity="0.5" />
            <circle cx="52" cy="29" r="4" fill="#10b981" fillOpacity="0.5" />
            <rect x="22" y="50" width="76" height="6" rx="3" fill="#1e3a5f" />
            <rect x="22" y="63" width="50" height="6" rx="3" fill="#172554" />
            <circle cx="88" cy="72" r="16" fill="#1e293b" stroke="#334155" />
            <path d="M82 72l4 4 8-8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/* ─── KPI Summary Bar ───────────────── */
function SummaryBar({ data }: { data: SiteAnalysis[] }) {
    const s = getAnalysisSummary(data)
    const items = [
        { label: 'Total', value: s.total, cls: 'text-slate-300', icon: <Globe size={14} /> },
        { label: 'OK', value: s.ok, cls: 'text-emerald-400', icon: <CheckCircle2 size={14} /> },
        { label: 'Avisos', value: s.warning + s.sslIssue, cls: 'text-amber-400', icon: <AlertTriangle size={14} /> },
        { label: 'Erros', value: s.error, cls: 'text-red-400', icon: <XCircle size={14} /> },
        { label: 'Resposta Média', value: `${s.avgResponseTime}ms`, cls: 'text-cyan-400', icon: <Zap size={14} /> },
        { label: 'Qualidade Média', value: `${s.avgQuality}`, cls: qualityColor(s.avgQuality), icon: <BarChart3 size={14} /> },
    ]
    return (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {items.map(({ label, value, cls, icon }) => (
                <div key={label} className="glass rounded-xl px-3 py-3 flex flex-col gap-1">
                    <div className={`flex items-center gap-1 ${cls}`}>{icon}</div>
                    <p className={`text-xl font-bold ${cls} leading-none`}>{value}</p>
                    <p className="text-[10px] text-slate-600">{label}</p>
                </div>
            ))}
        </div>
    )
}

/* ─── Default filters ───────────────── */
const DEFAULT_FILTERS: Filters = {
    statusFilter: [],
    maxResponseTime: 10000,
    hasSSL: null,
    mobileOnly: null,
    search: '',
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function WebsiteAnalysisPage() {
    const [data, setData] = useState<SiteAnalysis[]>([])
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
    const [sortKey, setSortKey] = useState<SortKey>('status')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0, business: '' })
    const [modalSite, setModalSite] = useState<SiteAnalysis | null>(null)
    const [showSidebar, setShowSidebar] = useState(true)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const hasStartedRef = useRef(false)

    /* ─── Real analysis ─── */
    const runAnalysis = useCallback(async (sites: { id: string, businessName: string, website: string }[]) => {
        if (isAnalyzing || sites.length === 0) return
        setIsAnalyzing(true)
        setData([])

        const results: SiteAnalysis[] = []

        for (let i = 0; i < sites.length; i++) {
            const site = sites[i]
            setAnalyzeProgress({ current: i, total: sites.length, business: site.businessName })

            try {
                const response = await axios.post('http://localhost:3002/api/analyze/site', site)
                const result: SiteAnalysis = {
                    ...response.data,
                    address: response.data.address || '',
                    businessType: response.data.businessType || 'Lead',
                    analyzedAt: response.data.analyzedAt || new Date().toISOString(),
                    selected: false
                }
                results.push(result)
                setData(prev => [...prev, result])
            } catch (err) {
                console.error('Analysis error:', err)
                const fallback: SiteAnalysis = {
                    id: site.id,
                    businessName: site.businessName,
                    website: site.website,
                    address: '',
                    businessType: 'Lead',
                    status: 'error',
                    statusCode: null,
                    responseTime: null,
                    ssl: 'missing',
                    redirectCount: 0,
                    screenshotUrl: null,
                    screenshotTimestamp: new Date().toISOString(),
                    quality: {
                        aestheticScore: 0,
                        layoutScore: 0,
                        colorScore: 0,
                        mobileScore: 0,
                        brokenImages: 0,
                        hasFavicon: false,
                        hasMetaDescription: false
                    },
                    rating: 0,
                    ratingCount: 0,
                    selected: false,
                    analyzedAt: new Date().toISOString(),
                    screenshotError: 'Falha na conexão com o servidor de análise'
                }
                results.push(fallback)
                setData(prev => [...prev, fallback])
            }
        }

        setIsAnalyzing(false)
        setAnalyzeProgress(prev => ({ ...prev, current: sites.length }))
    }, [isAnalyzing])



    /* ─── Check for pending analysis from LeadsPage ─── */
    useEffect(() => {
        if (hasStartedRef.current) return

        const pending = sessionStorage.getItem('pending_analysis')
        if (pending) {
            hasStartedRef.current = true
            sessionStorage.removeItem('pending_analysis') // Remove immediately to prevent multi-tabs/strict-mode from repeating
            try {
                const sites = JSON.parse(pending)
                if (Array.isArray(sites) && sites.length > 0) {
                    runAnalysis(sites)
                }
            } catch (e) {
                console.error('Failed to parse pending analysis', e)
            }
        }
    }, [runAnalysis])

    /* ─── Toggle select ─── */
    const toggleSelect = useCallback((id: string) => {
        setData(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d))
    }, [])

    const clearSelection = useCallback(() => {
        setData(prev => prev.map(d => ({ ...d, selected: false })))
    }, [])

    /* ─── Filters ─── */
    const updateFilter = useCallback((patch: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...patch }))
    }, [])

    /* ─── Derived data ─── */
    const statusCounts: Record<SiteStatus, number> = useMemo(() => ({
        ok: data.filter(d => d.status === 'ok').length,
        warning: data.filter(d => d.status === 'warning').length,
        error: data.filter(d => d.status === 'error').length,
        ssl_issue: data.filter(d => d.status === 'ssl_issue').length,
    }), [data])

    const filtered = useMemo(() => {
        let result = data
        if (filters.statusFilter.length > 0) result = result.filter(d => filters.statusFilter.includes(d.status))
        if (filters.maxResponseTime < 10000) result = result.filter(d => d.responseTime !== null && d.responseTime <= filters.maxResponseTime)
        if (filters.hasSSL === true) result = result.filter(d => d.ssl === 'valid')
        if (filters.mobileOnly === true) result = result.filter(d => d.quality.mobileScore >= 70)
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase()
            result = result.filter(d => d.businessName.toLowerCase().includes(q) || d.website.toLowerCase().includes(q))
        }

        // Sort
        result = [...result].sort((a, b) => {
            let cmp = 0
            switch (sortKey) {
                case 'status': {
                    const order: Record<SiteStatus, number> = { ok: 0, warning: 1, ssl_issue: 2, error: 3 }
                    cmp = order[a.status] - order[b.status]
                    break
                }
                case 'responseTime': cmp = (a.responseTime ?? 99999) - (b.responseTime ?? 99999); break
                case 'quality': cmp = b.quality.aestheticScore - a.quality.aestheticScore; break
                case 'name': cmp = a.businessName.localeCompare(b.businessName); break
            }
            return sortDir === 'asc' ? cmp : -cmp
        })
        return result
    }, [data, filters, sortKey, sortDir])

    const selectedCount = data.filter(d => d.selected).length

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }

    const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
        <button onClick={() => toggleSort(k)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${sortKey === k ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {label}
            {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
        </button>
    )

    return (
        <div className="min-h-screen bg-[#0a0f1e]">
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/6 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-cyan-600/20 flex items-center justify-center border border-cyan-500/30">
                            <Globe size={18} className="text-cyan-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Análise de Sites</h1>
                        <span className="text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">BETA</span>
                    </div>
                    <p className="text-sm text-slate-500 ml-12">Analise qualidade, performance e segurança dos sites das empresas</p>
                </header>

                {/* Actions & Filters */}
                <div className="flex items-center gap-2 mb-6 justify-end">
                    {/* Filter toggle on mobile */}
                    <button onClick={() => setShowSidebar(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-2 rounded-xl hover:bg-slate-800 transition-all">
                        <Filter size={13} /> {showSidebar ? 'Ocultar' : 'Filtros'}
                    </button>
                    {/* Inline search filter */}
                    {data.length > 0 && (
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={e => updateFilter({ search: e.target.value })}
                                placeholder="Filtrar resultados..."
                                className="bg-slate-800/60 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-44 transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* Progress */}
                {isAnalyzing && (
                    <div className="mb-6">
                        <AnalysisProgress {...analyzeProgress} />
                    </div>
                )}

                {/* Summary KPIs */}
                {data.length > 0 && <SummaryBar data={data} />}

                {/* Sort row */}
                {data.length > 0 && (
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-xs text-slate-600">Ordenar:</span>
                        <SortBtn k="status" label="Status" />
                        <SortBtn k="responseTime" label="Tempo" />
                        <SortBtn k="quality" label="Qualidade" />
                        <SortBtn k="name" label="Nome" />
                        <span className="ml-auto text-xs text-slate-600">{filtered.length} de {data.length} sites</span>
                    </div>
                )}

                {/* Main content */}
                {data.length === 0 && !isAnalyzing ? (
                    /* No results */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <EmptyIllustration />
                        <h2 className="text-lg font-semibold text-white mt-6 mb-2">Nenhum site pendente</h2>
                        <p className="text-sm text-slate-500 max-w-xs mb-6">
                            Para analisar um site, volte para a tela de busca, selecione as empresas desejadas e clique em <span className="text-cyan-400 font-medium">Analisar Sites</span>.
                        </p>
                    </div>
                ) : (
                    /* Cards + Sidebar */
                    <div className="flex gap-5">
                        {showSidebar && (
                            <FilterSidebar
                                filters={filters}
                                onChange={updateFilter}
                                onReset={() => setFilters(DEFAULT_FILTERS)}
                                counts={statusCounts}
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center py-20 text-slate-600">
                                    <Filter size={32} className="mb-3 text-slate-700" />
                                    <p className="text-sm">Nenhum site corresponde aos filtros</p>
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs text-indigo-400 mt-2 hover:text-indigo-300">
                                        Limpar filtros
                                    </button>
                                </div>
                            ) : (
                                <div className={`grid gap-4 ${showSidebar ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                    {filtered.map(site => (
                                        <SiteAnalysisCard
                                            key={site.id}
                                            site={site}
                                            onSelect={toggleSelect}
                                            onExpand={setModalSite}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk actions */}
            <BulkActionsBar
                selected={selectedCount}
                onReanalyze={() => { alert('Re-analisando selecionados...') }}
                onExport={() => { alert('Exportando relatório...') }}
                onEmail={() => { alert('Enviando relatório por email...') }}
                onClearSelection={clearSelection}
            />

            {/* Screenshot Modal */}
            {modalSite && <ScreenshotModal site={modalSite} onClose={() => setModalSite(null)} />}
        </div>
    )
}
