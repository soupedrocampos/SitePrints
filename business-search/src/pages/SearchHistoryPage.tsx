import { useState, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Search, MapPin, Clock, ChevronDown, ChevronUp, Download, Trash2,
    RotateCcw, Users, History, X, AlertTriangle, ChevronRight,
    Filter, SlidersHorizontal, ArrowUpDown, Tag,
} from 'lucide-react'
import {
    SEARCH_HISTORY, SearchHistoryItem, DateGroup,
    getDateGroup, relativeTime, exportHistoryCSV,
} from '../lib/searchHistoryData'

/* ── types ─────────────────────────────────────────── */
type SortKey = 'recent' | 'results' | 'leads'
type FilterRange = 'all' | 'today' | '7d' | '30d'

const GROUP_ORDER: DateGroup[] = ['Hoje', 'Ontem', 'Última Semana', 'Últimos 30 Dias']

const TYPE_COLORS: Record<string, string> = {
    Restaurante: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Varejo: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Serviços: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    Saúde: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Educação: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Automóveis: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Hotel: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    Academia: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

/* ── helpers ────────────────────────────────────────── */
function capturePercent(item: SearchHistoryItem) {
    return item.resultsFound ? Math.round((item.leadsCaptured / item.resultsFound) * 100) : 0
}

function highlight(text: string, query: string) {
    if (!query.trim()) return <>{text}</>
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(re)
    return (
        <>
            {parts.map((p, i) =>
                re.test(p) ? <mark key={i} className="bg-indigo-500/30 text-indigo-300 rounded px-0.5">{p}</mark> : p
            )}
        </>
    )
}

/* ── HISTORY ITEM ───────────────────────────────────── */
function HistoryCard({
    item, searchQuery, onRepeat, onDelete,
}: {
    item: SearchHistoryItem
    searchQuery: string
    onRepeat: (item: SearchHistoryItem) => void
    onDelete: (id: string) => void
}) {
    const [expanded, setExpanded] = useState(false)
    const capture = capturePercent(item)

    return (
        <div className="glass rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
            {/* Main row */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
                        <Search size={15} className="text-indigo-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-white leading-tight">
                                    {highlight(item.query, searchQuery)}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                        <MapPin size={10} className="text-slate-600 shrink-0" />
                                        {item.location}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-600">
                                        <Clock size={10} className="shrink-0" />
                                        {relativeTime(item.timestamp)} · {item.timestamp.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onRepeat(item)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-[11px] font-medium transition-all">
                                    <RotateCcw size={11} />
                                    Repetir
                                </button>
                                <Link to={`/leads?search=${encodeURIComponent(item.sessionId)}`}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white text-[11px] font-medium transition-all">
                                    <Users size={11} />
                                    Ver Leads
                                </Link>
                                <button onClick={() => onDelete(item.id)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Metric pills */}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                                <Search size={9} className="text-slate-500" />
                                {item.resultsFound} resultados
                            </span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${item.leadsCaptured > 0
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}>
                                <Users size={9} />
                                {item.leadsCaptured} leads · {capture}%
                            </span>

                            {/* Business type chips */}
                            {item.types.map(t => (
                                <span key={t}
                                    className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${TYPE_COLORS[t] ?? 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    {t}
                                </span>
                            ))}

                            {/* Expand button */}
                            <button onClick={() => setExpanded(!expanded)}
                                className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                                {expanded ? <><ChevronUp size={11} /> Menos</> : <><ChevronDown size={11} /> Parâmetros</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded parameters */}
            {expanded && (
                <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                            <p className="text-slate-600 text-[10px] font-medium uppercase tracking-wider mb-1">Raio de busca</p>
                            <p className="text-slate-300 flex items-center gap-1">
                                <MapPin size={10} className="text-indigo-400" />
                                {item.radiusKm} km do centro
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-600 text-[10px] font-medium uppercase tracking-wider mb-1">Tipos de negócio</p>
                            <div className="flex flex-wrap gap-1">
                                {item.types.map(t => (
                                    <span key={t} className={`px-1.5 py-0.5 rounded border text-[10px] ${TYPE_COLORS[t] ?? ''}`}>{t}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-600 text-[10px] font-medium uppercase tracking-wider mb-1">Filtros aplicados</p>
                            {item.additionalFilters.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                    {item.additionalFilters.map(f => (
                                        <span key={f} className="text-slate-400 flex items-center gap-1">
                                            <Filter size={9} className="text-slate-600" /> {f}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-slate-600 italic">Nenhum filtro aplicado</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   SEARCH HISTORY PAGE
═══════════════════════════════════════════════════════ */
export default function SearchHistoryPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [sort, setSort] = useState<SortKey>('recent')
    const [filterRange, setFilterRange] = useState<FilterRange>('all')
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [items, setItems] = useState<SearchHistoryItem[]>(SEARCH_HISTORY)
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10
    const sortRef = useRef<HTMLDivElement>(null)

    /* ── filter + sort ────────────────────────────────── */
    const filtered = useMemo(() => {
        const now = new Date('2026-02-28T15:00:00')
        let list = items.filter(i => {
            if (searchQuery && !i.query.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !i.location.toLowerCase().includes(searchQuery.toLowerCase())) return false
            if (filterRange === 'today') {
                const diffH = (now.getTime() - i.timestamp.getTime()) / 3_600_000
                return diffH < 24
            }
            if (filterRange === '7d') {
                const diffD = (now.getTime() - i.timestamp.getTime()) / 86_400_000
                return diffD < 7
            }
            if (filterRange === '30d') {
                const diffD = (now.getTime() - i.timestamp.getTime()) / 86_400_000
                return diffD < 30
            }
            return true
        })

        if (sort === 'recent') list = [...list].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        else if (sort === 'results') list = [...list].sort((a, b) => b.resultsFound - a.resultsFound)
        else list = [...list].sort((a, b) => b.leadsCaptured - a.leadsCaptured)

        return list
    }, [items, searchQuery, sort, filterRange])

    /* ── pagination ───────────────────────────────────── */
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paged = filtered.slice(0, page * PAGE_SIZE)

    /* ── groups (only from paged slice, but group headers from all filtered) ── */
    const grouped = useMemo(() => {
        const map: Partial<Record<DateGroup, SearchHistoryItem[]>> = {}
        paged.forEach(i => {
            const g = getDateGroup(i.timestamp)
            if (!map[g]) map[g] = []
            map[g]!.push(i)
        })
        return GROUP_ORDER.filter(g => map[g]).map(g => ({ group: g, items: map[g]! }))
    }, [paged])

    const handleRepeat = useCallback((item: SearchHistoryItem) => {
        navigate(`/?q=${encodeURIComponent(item.query)}&loc=${encodeURIComponent(item.location)}`)
    }, [navigate])

    const handleDelete = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }, [])

    const handleClearAll = useCallback(() => {
        setItems([])
        setShowClearConfirm(false)
    }, [])

    /* ── stats bar ────────────────────────────────────── */
    const stats = useMemo(() => ({
        total: items.length,
        resultsSum: items.reduce((s, i) => s + i.resultsFound, 0),
        leadsSum: items.reduce((s, i) => s + i.leadsCaptured, 0),
    }), [items])

    /* ── SORT LABELS ─────────────────────────────────── */
    const SORT_LABELS: Record<SortKey, string> = {
        recent: 'Mais Recentes',
        results: 'Mais Resultados',
        leads: 'Mais Leads Capturados',
    }

    const RANGE_LABELS: Record<FilterRange, string> = {
        all: 'Todos os períodos',
        today: 'Hoje',
        '7d': 'Últimos 7 dias',
        '30d': 'Últimos 30 dias',
    }

    /* ── EMPTY STATE ─────────────────────────────────── */
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] pt-14 flex items-center justify-center">
                <div className="text-center max-w-sm px-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                        <History size={28} className="text-slate-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">Nenhuma busca ainda</h2>
                    <p className="text-sm text-slate-500 mb-6">Faça sua primeira busca para começar a capturar leads de empresas.</p>
                    <Link to="/"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition-all">
                        <Search size={14} />
                        Começar a Buscar
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14 pb-12">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/4 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-600/4 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">

                {/* ─ HEADER ──────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <History size={18} className="text-indigo-400" />
                            Histórico de Buscas
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {stats.total} busca{stats.total !== 1 ? 's' : ''} · {stats.resultsSum.toLocaleString()} resultados · {stats.leadsSum} leads
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => exportHistoryCSV(filtered)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 text-xs font-medium transition-all">
                            <Download size={12} />
                            Exportar CSV
                        </button>
                        <button onClick={() => setShowClearConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15 text-xs font-medium transition-all">
                            <Trash2 size={12} />
                            Limpar Histórico
                        </button>
                    </div>
                </div>

                {/* ─ FILTERS ─────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search within history */}
                    <div className="relative flex-1 min-w-52">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                            placeholder="Filtrar buscas..."
                            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    {/* Date range filter */}
                    <div className="relative">
                        <select value={filterRange} onChange={e => { setFilterRange(e.target.value as FilterRange); setPage(1) }}
                            className="appearance-none bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 pr-7 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-all">
                            {(Object.entries(RANGE_LABELS) as [FilterRange, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative" ref={sortRef}>
                        <button onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs text-slate-300 hover:text-white transition-all">
                            <ArrowUpDown size={11} className="text-slate-500" />
                            {SORT_LABELS[sort]}
                            <ChevronDown size={10} className="text-slate-500" />
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-1 z-20 shadow-xl min-w-44">
                                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, v]) => (
                                    <button key={k} onClick={() => { setSort(k); setShowSortMenu(false) }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${sort === k ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'}`}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─ ACTIVE FILTER PILL ─────────────────────── */}
                {(searchQuery || filterRange !== 'all') && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {searchQuery && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[11px]">
                                <Search size={9} /> "{searchQuery}"
                                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-white"><X size={9} /></button>
                            </span>
                        )}
                        {filterRange !== 'all' && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[11px]">
                                <Clock size={9} /> {RANGE_LABELS[filterRange]}
                                <button onClick={() => setFilterRange('all')} className="ml-1 hover:text-white"><X size={9} /></button>
                            </span>
                        )}
                        <span className="text-[11px] text-slate-600">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* ─ EMPTY SEARCH RESULT ───────────────────── */}
                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <Search size={24} className="text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Nenhuma busca encontrada para "<span className="text-slate-400">{searchQuery}</span>"</p>
                        <button onClick={() => { setSearchQuery(''); setFilterRange('all') }}
                            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Limpar filtros</button>
                    </div>
                )}

                {/* ─ GROUPED TIMELINE ─────────────────────── */}
                <div className="space-y-6">
                    {grouped.map(({ group, items: groupItems }) => (
                        <section key={group}>
                            {/* Group header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{group}</div>
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-[10px] text-slate-700">{groupItems.length} busca{groupItems.length !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Cards */}
                            <div className="space-y-2.5">
                                {groupItems.map(item => (
                                    <HistoryCard
                                        key={item.id}
                                        item={item}
                                        searchQuery={searchQuery}
                                        onRepeat={handleRepeat}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* ─ LOAD MORE ─────────────────────────────── */}
                {page < totalPages && (
                    <div className="text-center pt-2">
                        <button onClick={() => setPage(p => p + 1)}
                            className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                            Carregar mais ({filtered.length - page * PAGE_SIZE} restantes)
                        </button>
                    </div>
                )}

                {/* ─ PAGINATION INFO ────────────────────────── */}
                {filtered.length > 0 && (
                    <p className="text-center text-[11px] text-slate-700">
                        Mostrando {Math.min(paged.length, filtered.length)} de {filtered.length} busca{filtered.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* ─ CLEAR CONFIRMATION MODAL ───────────────── */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowClearConfirm(false) }}>
                    <div className="glass rounded-2xl p-6 w-full max-w-sm border border-red-500/20 shadow-2xl">
                        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                            <AlertTriangle size={18} className="text-red-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">Limpar todo o histórico?</h3>
                        <p className="text-xs text-slate-500 mb-5">
                            Esta ação irá remover {items.length} busca{items.length !== 1 ? 's' : ''} do histórico. Não é possível desfazer.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleClearAll}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-medium transition-all">
                                Limpar {items.length} busca{items.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
