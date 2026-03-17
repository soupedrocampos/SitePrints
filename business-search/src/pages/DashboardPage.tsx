import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    Users, TrendingUp, Star, Zap, RefreshCw, Download, Calendar,
    X, ChevronRight, Target, Activity, BarChart2, Clock, CheckCircle2,
    AlertCircle, MessageSquare, Phone, Mail, FileText, Database,
    ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line,
} from 'recharts'
import {
    DateRange, getKPI, getStatusChart, getSourceChart,
    getEnrichmentStats, getSearchTimeline,
    TIMELINE, TOP_LEADS, TimelineActivity,
} from '../lib/dashboardData'

/* ── helpers ─────────────────────────────────────────── */
const DATE_LABELS: Record<DateRange, string> = {
    today: 'Hoje', '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', custom: 'Personalizado',
}

function qColor(q: number) {
    if (q >= 80) return 'text-emerald-400'
    if (q >= 60) return 'text-yellow-400'
    return 'text-red-400'
}
function qBg(q: number) {
    if (q >= 80) return 'bg-emerald-500'
    if (q >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
}

const ACTIVITY_ICONS: Record<TimelineActivity['type'], React.ReactNode> = {
    note: <FileText size={12} />,
    call: <Phone size={12} />,
    email: <Mail size={12} />,
    status: <Activity size={12} />,
    enrich: <Database size={12} />,
}
const ACTIVITY_COLORS: Record<TimelineActivity['type'], string> = {
    note: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
    call: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    email: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    status: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    enrich: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
}

/* ── custom chart tooltip ─────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass px-3 py-2 rounded-xl shadow-xl border border-slate-700">
            {label && <p className="text-[10px] text-slate-400 mb-1">{label}</p>}
            {payload.map((p: any) => (
                <p key={p.name} className="text-xs font-medium" style={{ color: p.color || p.fill }}>
                    {p.name}: <span className="text-white">{p.value}</span>
                </p>
            ))}
        </div>
    )
}

function SkelCard({ h = 'h-36' }: { h?: string }) {
    return <div className={`glass rounded-2xl ${h} animate-pulse`} />
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
    const [range, setRange] = useState<DateRange>('7d')
    const [loading, setLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [showRangePicker, setShowRangePicker] = useState(false)

    const kpi = getKPI(range)
    const statusData = getStatusChart(range)
    const sourceData = getSourceChart(range)
    const enrichStats = getEnrichmentStats(range)
    const searchLine = getSearchTimeline(range)

    const load = useCallback(() => {
        setLoading(true)
        setTimeout(() => { setLoading(false); setLastRefresh(new Date()) }, 700)
    }, [])

    useEffect(() => { load() }, [range, load])

    useEffect(() => {
        if (!autoRefresh) return
        const id = setInterval(() => load(), 30_000)
        return () => clearInterval(id)
    }, [autoRefresh, load])

    const activeGroups = Object.entries(
        TIMELINE.reduce<Record<string, TimelineActivity[]>>((acc, a) => {
            acc[a.date] = [...(acc[a.date] ?? []), a]
            return acc
        }, {})
    )

    const totalSearches = searchLine.reduce((s, d) => s + d.searches, 0)
    const totalLeadsCaptured = searchLine.reduce((s, d) => s + d.leads, 0)
    const captureRate = totalSearches ? Math.round((totalLeadsCaptured / totalSearches) * 100) : 0

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14 pb-12">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-6 space-y-5">

                {/* ─ HEADER ─────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart2 size={18} className="text-indigo-400" />
                            Dashboard
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Atualizado {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Date range */}
                        <div className="relative">
                            <button onClick={() => setShowRangePicker(!showRangePicker)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs text-white hover:border-indigo-500/50 transition-colors">
                                <Calendar size={12} className="text-indigo-400" />
                                {DATE_LABELS[range]}
                                <ChevronRight size={11} className={`text-slate-500 transition-transform ${showRangePicker ? 'rotate-90' : ''}`} />
                            </button>
                            {showRangePicker && (
                                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-1 z-20 shadow-xl min-w-40">
                                    {(Object.entries(DATE_LABELS) as [DateRange, string][]).map(([key, label]) => (
                                        <button key={key} onClick={() => { setRange(key); setShowRangePicker(false) }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${range === key ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Auto-refresh toggle */}
                        <button onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all ${autoRefresh ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                            <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                            {autoRefresh ? 'Auto' : 'Refresh'}
                        </button>

                        {/* Manual refresh */}
                        <button onClick={() => load()} disabled={loading}
                            className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 transition-all">
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        </button>

                        {/* Export */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                            <Download size={12} />
                            Exportar PDF
                        </button>
                    </div>
                </div>

                {/* Filter banner */}
                {range !== '7d' && (
                    <div className="fade-in flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                        <Calendar size={13} className="text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-300 flex-1">Filtrando por: <strong>{DATE_LABELS[range]}</strong></p>
                        <button onClick={() => setRange('7d')} className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                            <X size={10} /> Limpar
                        </button>
                    </div>
                )}

                {/* ── ROW 1: KPI CARDS ──────────────────────────── */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {loading ? <>
                        <SkelCard /><SkelCard /><SkelCard /><SkelCard />
                    </> : <>
                        {/* Total Leads */}
                        <KPICard icon={<Users size={16} />} iconColor="bg-indigo-500/20 text-indigo-400">
                            <p className="text-[11px] text-slate-500 font-medium">Total Leads</p>
                            <p className="text-3xl font-bold text-white mt-0.5">{kpi.totalLeads.toLocaleString()}</p>
                            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${kpi.totalLeadsDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {kpi.totalLeadsDelta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                {kpi.totalLeadsDelta >= 0 ? '+' : ''}{kpi.totalLeadsDelta}% vs período anterior
                            </div>
                        </KPICard>

                        {/* Conversion Rate */}
                        <KPICard icon={<Target size={16} />} iconColor="bg-emerald-500/20 text-emerald-400">
                            <p className="text-[11px] text-slate-500 font-medium">Taxa de Conversão</p>
                            <p className="text-3xl font-bold text-white mt-0.5">{kpi.conversionRate}%</p>
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-slate-500">Meta: {kpi.conversionTarget}%</span>
                                    <span className={`text-[10px] font-medium ${kpi.conversionRate >= kpi.conversionTarget ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        {kpi.conversionRate >= kpi.conversionTarget ? 'Atingida ✓' : `${kpi.conversionTarget - kpi.conversionRate}% restante`}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${kpi.conversionRate >= kpi.conversionTarget ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${Math.min(100, (kpi.conversionRate / kpi.conversionTarget) * 100)}%` }} />
                                </div>
                            </div>
                        </KPICard>

                        {/* Active Leads with status chips */}
                        <KPICard icon={<Zap size={16} />} iconColor="bg-yellow-500/20 text-yellow-400">
                            <p className="text-[11px] text-slate-500 font-medium">Leads Ativos</p>
                            <p className="text-3xl font-bold text-white mt-0.5">{kpi.activeLeads}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {[
                                    { key: 'Novo', c: 'bg-indigo-500/20 text-indigo-400' },
                                    { key: 'Contatado', c: 'bg-blue-500/20 text-blue-400' },
                                    { key: 'Qualificado', c: 'bg-emerald-500/20 text-emerald-400' },
                                ].map(({ key, c }) => (
                                    <Link key={key} to={`/leads`}
                                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${c} hover:opacity-75 transition-opacity`}>
                                        {key} {kpi.statusBreakdown[key]}
                                    </Link>
                                ))}
                            </div>
                        </KPICard>

                        {/* Quality Score */}
                        <KPICard icon={<Star size={16} />} iconColor="bg-purple-500/20 text-purple-400">
                            <p className="text-[11px] text-slate-500 font-medium">Score Médio</p>
                            <p className={`text-3xl font-bold mt-0.5 ${qColor(kpi.avgQuality)}`}>{kpi.avgQuality}</p>
                            <p className="text-[10px] text-slate-600">/ 100</p>
                            {/* Distribution bars */}
                            <div className="flex items-end gap-0.5 h-5 mt-2">
                                {kpi.qualityDist.map((v, i) => {
                                    const max = Math.max(...kpi.qualityDist) || 1
                                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500']
                                    return <div key={i} className={`flex-1 ${colors[i]} rounded-sm opacity-80`} style={{ height: `${(v / max) * 100}%` }} />
                                })}
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-600 mt-0.5">
                                <span>0</span><span>50</span><span>100</span>
                            </div>
                        </KPICard>
                    </>}
                </div>

                {/* ── ROW 2: CHARTS ─────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                    {/* Donut — Status (60%) */}
                    <div className="xl:col-span-3 glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <Activity size={13} className="text-indigo-400" />
                                </div>
                                Leads por Status
                            </h2>
                            <span className="text-[10px] text-slate-500">{DATE_LABELS[range]}</span>
                        </div>
                        {loading ? <div className="h-52 animate-pulse bg-slate-800/50 rounded-xl" /> : (
                            <div className="flex items-center gap-6">
                                <div className="flex-1 h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                                                paddingAngle={3} dataKey="value" stroke="none">
                                                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Legend */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    {statusData.map((s) => (
                                        <Link key={s.name} to="/leads"
                                            className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{s.name}</span>
                                            <span className="text-xs font-semibold text-white ml-auto pl-4">{s.value}</span>
                                        </Link>
                                    ))}
                                    <div className="border-t border-slate-700 pt-2 mt-1">
                                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{statusData.reduce((s, d) => s + d.value, 0)}</span></p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bar — Source (40%) */}
                    <div className="xl:col-span-2 glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <BarChart2 size={13} className="text-emerald-400" />
                                </div>
                                Origem dos Leads
                            </h2>
                            <span className="text-[10px] text-slate-500">{DATE_LABELS[range]}</span>
                        </div>
                        {loading ? <div className="h-52 animate-pulse bg-slate-800/50 rounded-xl" /> : (
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sourceData} layout="vertical" margin={{ left: 0, right: 16 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="source" tick={{ fill: '#94a3b8', fontSize: 11 }} width={84} tickLine={false} axisLine={false} />
                                        <CartesianGrid horizontal={false} stroke="#1e293b" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.07)' }} />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 11 }}>
                                            {sourceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── ROW 3: TIMELINE + TOP LEADS ─────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Activity Timeline */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Clock size={13} className="text-blue-400" />
                                </div>
                                Atividades Recentes
                            </h2>
                            <Link to="/leads" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
                                Ver todas <ChevronRight size={10} />
                            </Link>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-none">
                            {activeGroups.map(([date, acts]) => (
                                <div key={date}>
                                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider mb-1.5">{date}</p>
                                    <div className="space-y-2">
                                        {acts.map((a) => (
                                            <div key={a.id} className="flex items-start gap-2.5 group">
                                                {/* Avatar */}
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${a.userColor}`}>
                                                    {a.userInitials}
                                                </div>
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-1 ${ACTIVITY_COLORS[a.type]}`}>
                                                            {ACTIVITY_ICONS[a.type]}
                                                            {a.type}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">{a.time}</span>
                                                    </div>
                                                    <p className="text-xs text-white font-medium mt-0.5 truncate">{a.company}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{a.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Quality Leads */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                    <Star size={13} className="text-yellow-400" />
                                </div>
                                Top Leads por Qualidade
                            </h2>
                            <Link to="/leads" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
                                Ver todos <ChevronRight size={10} />
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            {TOP_LEADS.map((lead, i) => (
                                <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors group">
                                    {/* Rank */}
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                            i === 1 ? 'bg-slate-500/20 text-slate-400' :
                                                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-slate-700/50 text-slate-500'
                                        }`}>#{i + 1}</div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{lead.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${lead.statusColor}`}>{lead.status}</span>
                                            <span className="font-mono text-[9px] text-slate-600">{lead.cnpj}</span>
                                        </div>
                                    </div>
                                    {/* Score */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`text-sm font-bold ${qColor(lead.quality)}`}>{lead.quality}</span>
                                        <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${qBg(lead.quality)}`} style={{ width: `${lead.quality}%` }} />
                                        </div>
                                    </div>
                                    {/* Link */}
                                    <Link to={`/leads/${lead.id}`}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300">
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── ROW 4: ENRICHMENT STATS ──────────────────── */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Database size={13} className="text-purple-400" />
                            </div>
                            Enriquecimento de Dados
                        </h2>
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium transition-all hover:shadow-lg hover:shadow-purple-500/20">
                            <Zap size={12} />
                            Enriquecer Pendentes ({enrichStats.pending})
                        </button>
                    </div>

                    {loading ? <div className="h-20 animate-pulse bg-slate-800/50 rounded-xl" /> : (
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Success rate */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-slate-500">Taxa de sucesso</span>
                                    <span className="text-xs font-bold text-emerald-400">{enrichStats.successRate}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${enrichStats.successRate}%` }} />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <CheckCircle2 size={11} className="text-emerald-400" />
                                    <span className="text-[10px] text-slate-500">{enrichStats.enriched} enriquecidos</span>
                                </div>
                            </div>
                            {/* Avg time */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-slate-500">Tempo médio</span>
                                    <span className="text-xs font-bold text-blue-400">{enrichStats.avgTimeSeconds}s</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }} />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Clock size={11} className="text-blue-400" />
                                    <span className="text-[10px] text-slate-500">por empresa</span>
                                </div>
                            </div>
                            {/* Pending */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-slate-500">Pendentes</span>
                                    <span className="text-xs font-bold text-yellow-400">{enrichStats.pending}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, enrichStats.pending * 2)}%` }} />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <AlertCircle size={11} className="text-yellow-400" />
                                    <span className="text-[10px] text-slate-500">aguardando processamento</span>
                                </div>
                            </div>
                            {/* Failed */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-slate-500">Falhas</span>
                                    <span className="text-xs font-bold text-red-400">{enrichStats.failed}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (100 - enrichStats.successRate))}%` }} />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <X size={11} className="text-red-400" />
                                    <span className="text-[10px] text-slate-500">erros de consulta</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── ROW 5: SEARCH PERFORMANCE ────────────────── */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <TrendingUp size={13} className="text-indigo-400" />
                            </div>
                            Performance de Busca
                        </h2>
                        <div className="flex items-center gap-4">
                            {[
                                { label: 'Total buscas', value: totalSearches, color: 'text-indigo-400' },
                                { label: 'Taxa de captura', value: `${captureRate}%`, color: 'text-emerald-400' },
                                { label: 'Leads capturados', value: totalLeadsCaptured, color: 'text-yellow-400' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="text-right">
                                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                                    <p className="text-[10px] text-slate-500">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {loading ? <div className="h-52 animate-pulse bg-slate-800/50 rounded-xl" /> : (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={searchLine} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }}
                                        tickLine={false} axisLine={false}
                                        interval={range === 'today' ? 3 : range === '30d' ? 4 : 0} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="searches" name="Buscas" stroke="#6366f1" strokeWidth={2}
                                        dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                                    <Line type="monotone" dataKey="leads" name="Leads capturados" stroke="#10b981" strokeWidth={2}
                                        dot={false} activeDot={{ r: 4, fill: '#10b981' }} strokeDasharray="4 2" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Chart legend */}
                    <div className="flex items-center gap-6 mt-3 justify-center">
                        {[
                            { color: 'bg-indigo-500', label: 'Buscas', dash: false },
                            { color: 'bg-emerald-500', label: 'Leads capturados', dash: true },
                        ].map(({ color, label, dash }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={`w-5 h-0.5 ${color} ${dash ? 'opacity-60' : ''}`} />
                                <span className="text-[10px] text-slate-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

/* ── Shared KPI card wrapper ─────────────────────────── */
function KPICard({ icon, iconColor, children }: {
    icon: React.ReactNode
    iconColor: string
    children: React.ReactNode
}) {
    return (
        <div className="glass rounded-2xl p-4 flex flex-col gap-0.5 hover:border-slate-600 transition-colors border border-slate-800">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${iconColor}`}>
                {icon}
            </div>
            {children}
        </div>
    )
}
