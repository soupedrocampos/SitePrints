import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ChevronRight, Pencil, Trash2, RefreshCw, Globe, Phone, Mail, MapPin,
    Copy, Check, ExternalLink, Building2, Star, Map, Plus, X, ChevronDown,
    FileText, PhoneCall, CalendarDays, MessageSquare, Zap, Clock, AlertTriangle,
    CheckCircle2, XCircle, Printer,
} from 'lucide-react'
import { Lead, LeadStatus, Activity, ActivityType } from '../types/lead'
import { mockLeads } from '../lib/mockLeads'
import { STATUS_COLORS, STATUS_DOT, qualityColor, formatDate } from '../lib/leadHelpers'

/* ── helpers ─────────────────────────────────────────── */
function useClipboard() {
    const [copied, setCopied] = useState<string | null>(null)
    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopied(key)
        setTimeout(() => setCopied(null), 1800)
    }
    return { copied, copy }
}

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'agora'
    if (m < 60) return `${m}m atrás`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h atrás`
    return `${Math.floor(h / 24)}d atrás`
}

const ACTIVITY_ICONS: Record<ActivityType, JSX.Element> = {
    note: <FileText size={13} />, call: <PhoneCall size={13} />, email: <Mail size={13} />,
    meeting: <CalendarDays size={13} />, status_change: <Zap size={13} />,
    enrichment: <RefreshCw size={13} />, created: <Plus size={13} />,
}

const ALL_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Convertido', 'Rejeitado']
const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
    { value: 'note', label: 'Nota' }, { value: 'call', label: 'Ligação' },
    { value: 'email', label: 'E-mail' }, { value: 'meeting', label: 'Reunião' },
]

/* ── sub-components ──────────────────────────────────── */
function CopyBtn({ text, k, copied, copy }: { text: string; k: string; copied: string | null; copy: (t: string, k: string) => void }) {
    return (
        <button onClick={() => copy(text, k)} className="p-1 rounded-lg text-slate-600 hover:text-indigo-400 transition-colors">
            {copied === k ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
    )
}

function Card({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
                {extra}
            </div>
            <div className="p-4">{children}</div>
        </div>
    )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-800/60 last:border-0">
            <span className="text-[11px] text-slate-500 shrink-0 pt-0.5">{label}</span>
            <div className="text-xs text-white text-right">{children}</div>
        </div>
    )
}

/* ── Circular quality indicator ──────────────────────── */
function QualityRing({ value }: { value: number }) {
    const r = 28, circ = 2 * Math.PI * r
    const dash = (value / 100) * circ
    const color = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : value >= 25 ? '#f97316' : '#ef4444'
    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="80" height="80">
                <circle cx="40" cy="40" r={r} stroke="#1e2a40" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="6" fill="none"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div className="text-center">
                <p className="text-lg font-bold text-white leading-none">{value}</p>
                <p className="text-[9px] text-slate-500">score</p>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { copied, copy } = useClipboard()

    const [lead, setLead] = useState<Lead | null>(null)
    const [loading, setLoading] = useState(true)

    // Modals
    const [showEdit, setShowEdit] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [cnaeExpanded, setCnaeExpanded] = useState(false)

    // Activity form
    const [activityType, setActivityType] = useState<ActivityType>('note')
    const [activityText, setActivityText] = useState('')

    useEffect(() => {
        setLoading(true)
        setTimeout(() => {
            const found = mockLeads.find((l) => l.id === id) ?? null
            setLead(found)
            setLoading(false)
        }, 400)
    }, [id])

    if (loading) return <LoadingSkeleton />
    if (!lead) return (
        <div className="min-h-screen bg-[#0a0f1e] pt-20 flex items-center justify-center">
            <div className="text-center">
                <p className="text-white text-lg mb-3">Lead não encontrado</p>
                <button onClick={() => navigate('/leads')} className="btn-primary">← Voltar</button>
            </div>
        </div>
    )

    const handleStatusChange = (status: LeadStatus) => {
        setLead({ ...lead, status })
        setShowStatusModal(false)
    }

    const handleAddActivity = () => {
        if (!activityText.trim()) return
        const newActivity: Activity = {
            id: `act-new-${Date.now()}`, type: activityType,
            description: activityText, user: 'Você',
            timestamp: new Date().toISOString(),
        }
        setLead({ ...lead, activities: [newActivity, ...(lead.activities ?? [])] })
        setActivityText('')
        setShowAddActivity(false)
    }

    const handleEnrich = () => setLead({ ...lead, enriched: true, cnpjEnrichment: { ...lead.cnpjEnrichment, status: 'pending' } })
    const handleDelete = () => { navigate('/leads') }

    const enr = lead.cnpjEnrichment
    const places = lead.placesData
    const dq = lead.dataQuality

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-60">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-700/8 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-700/8 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <Link to="/leads" className="hover:text-white transition-colors">Meus Leads</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-300 truncate max-w-48">{lead.name}</span>
                </nav>

                {/* ── HEADER ── */}
                <div className="glass rounded-2xl p-5 mb-5 fade-in">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            {/* Source icon */}
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0">
                                {lead.source === 'Google Maps' ? '🗺️' : lead.source === 'Manual' ? '✏️' : '📥'}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white leading-tight">{lead.name}</h1>
                                {lead.tradeName && <p className="text-sm text-slate-500">Nome fantasia: {lead.tradeName}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[lead.status]}`} />
                                        {lead.status}
                                    </span>
                                    <span className="text-xs text-slate-500">{lead.source}</span>
                                    <span className="text-xs text-slate-600">•</span>
                                    <span className="text-xs text-slate-500">Criado {formatDate(lead.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <QualityRing value={lead.quality} />

                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setShowEdit(true)}
                                    className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all" title="Editar">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => setShowStatusModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
                                    <Zap size={12} /> Status <ChevronDown size={10} />
                                </button>
                                <button onClick={handleEnrich} disabled={lead.enriched && enr?.status === 'enriched'}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-600/30 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    <RefreshCw size={12} /> Enriquecer
                                </button>
                                <button onClick={() => window.print()}
                                    className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all" title="Imprimir">
                                    <Printer size={14} />
                                </button>
                                <button onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all" title="Excluir">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3-COLUMN LAYOUT ── */}
                <div className="grid grid-cols-12 gap-4">

                    {/* ─ LEFT: Basic Info + Places (col-span-5) ─ */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

                        {/* Basic Information */}
                        <Card title="Informações Básicas">
                            <div className="flex flex-col">
                                <InfoRow label="Empresa">{lead.name}</InfoRow>
                                {lead.tradeName && <InfoRow label="Nome Fantasia">{lead.tradeName}</InfoRow>}
                                <InfoRow label="CNPJ">
                                    <div className="flex items-center gap-1 font-mono">
                                        {lead.cnpj}
                                        <CopyBtn text={lead.cnpj} k="cnpj" copied={copied} copy={copy} />
                                    </div>
                                </InfoRow>
                                {lead.website && (
                                    <InfoRow label="Website">
                                        <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline-offset-2 underline">
                                            {lead.website.replace('https://www.', '')}
                                            <ExternalLink size={10} />
                                        </a>
                                    </InfoRow>
                                )}
                                {lead.phone && (
                                    <InfoRow label="Telefone">
                                        <div className="flex items-center gap-1">
                                            <a href={`tel:${lead.phone}`} className="text-indigo-400 hover:text-indigo-300">{lead.phone}</a>
                                            <CopyBtn text={lead.phone} k="phone" copied={copied} copy={copy} />
                                        </div>
                                    </InfoRow>
                                )}
                                {lead.email && (
                                    <InfoRow label="E-mail">
                                        <div className="flex items-center gap-1">
                                            <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:text-indigo-300">{lead.email}</a>
                                            <CopyBtn text={lead.email} k="email" copied={copied} copy={copy} />
                                        </div>
                                    </InfoRow>
                                )}
                                {lead.address && (
                                    <InfoRow label="Endereço">
                                        <div className="flex items-center gap-1">
                                            <span>{lead.address}</span>
                                            <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`} target="_blank" rel="noopener noreferrer"
                                                className="text-slate-500 hover:text-indigo-400 transition-colors">
                                                <Map size={11} />
                                            </a>
                                        </div>
                                    </InfoRow>
                                )}
                            </div>
                        </Card>

                        {/* Google Places */}
                        {places && (
                            <Card title="Google Places" extra={
                                <a href={places.mapsUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                                    Ver no Maps <ExternalLink size={10} />
                                </a>
                            }>
                                <div className="flex flex-col gap-2">
                                    <InfoRow label="Place ID">
                                        <div className="flex items-center gap-1 font-mono text-[11px]">
                                            <span className="truncate max-w-36">{places.placeId}</span>
                                            <CopyBtn text={places.placeId ?? ''} k="placeId" copied={copied} copy={copy} />
                                        </div>
                                    </InfoRow>
                                    {places.rating && (
                                        <InfoRow label="Avaliação">
                                            <div className="flex items-center gap-1">
                                                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                                                <span>{places.rating.toFixed(1)}</span>
                                                <span className="text-slate-500 text-[11px]">({places.reviewCount} reviews)</span>
                                            </div>
                                        </InfoRow>
                                    )}
                                    {places.types && (
                                        <InfoRow label="Tipos">
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {places.types.map((t) => (
                                                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-700/60 text-[10px] text-slate-400">{t}</span>
                                                ))}
                                            </div>
                                        </InfoRow>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ─ MIDDLE: Enrichment (col-span-4) ─ */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

                        <Card title="Dados CNPJ" extra={
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${enr?.status === 'enriched' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    enr?.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                }`}>
                                {enr?.status === 'enriched' ? '✓ Enriquecido' : enr?.status === 'failed' ? '✗ Falhou' : '⏳ Pendente'}
                            </span>
                        }>
                            {enr?.status === 'enriched' ? (
                                <div className="flex flex-col">
                                    {enr.lastEnrichedAt && (
                                        <InfoRow label="Enriquecido em">
                                            <span>{formatDate(enr.lastEnrichedAt)}</span>
                                        </InfoRow>
                                    )}
                                    {enr.matchConfidence && (
                                        <InfoRow label="Confiança">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${qualityColor(enr.matchConfidence)}`} style={{ width: `${enr.matchConfidence}%` }} />
                                                </div>
                                                <span>{enr.matchConfidence}%</span>
                                            </div>
                                        </InfoRow>
                                    )}
                                    {enr.legalName && <InfoRow label="Razão Social"><span className="font-medium">{enr.legalName}</span></InfoRow>}
                                    {enr.cnaePrimary && (
                                        <InfoRow label="CNAE Principal">
                                            <div className="text-right">
                                                <p className="text-indigo-300 font-mono text-[11px]">{enr.cnaePrimary.code}</p>
                                                <p className="text-[10px] text-slate-400 max-w-40">{enr.cnaePrimary.description}</p>
                                            </div>
                                        </InfoRow>
                                    )}
                                    {enr.cnaeSecondary && enr.cnaeSecondary.length > 0 && (
                                        <div className="py-2 border-b border-slate-800/60">
                                            <button onClick={() => setCnaeExpanded(!cnaeExpanded)}
                                                className="flex items-center justify-between w-full text-[11px] text-slate-500 hover:text-white">
                                                <span>CNAE Secundário ({enr.cnaeSecondary.length})</span>
                                                <ChevronDown size={12} className={`transition-transform ${cnaeExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {cnaeExpanded && (
                                                <div className="mt-2 flex flex-col gap-1.5">
                                                    {enr.cnaeSecondary.map((c) => (
                                                        <div key={c.code} className="flex items-start gap-2">
                                                            <span className="font-mono text-[10px] text-indigo-400 shrink-0">{c.code}</span>
                                                            <span className="text-[10px] text-slate-400">{c.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {enr.companySize && <InfoRow label="Porte">{enr.companySize}</InfoRow>}
                                    {enr.legalNature && <InfoRow label="Natureza Jurídica"><span className="text-right text-[11px]">{enr.legalNature}</span></InfoRow>}
                                    {enr.foundingDate && <InfoRow label="Fundação">{enr.foundingDate}</InfoRow>}
                                    {enr.shareCapital != null && (
                                        <InfoRow label="Capital Social">
                                            {enr.shareCapital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </InfoRow>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        {enr.simplesNacional != null && (
                                            <span className={`flex-1 text-center py-1 rounded-lg text-[10px] font-medium border ${enr.simplesNacional ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-slate-800/60 text-slate-500 border-slate-700'}`}>
                                                Simples {enr.simplesNacional ? 'Sim' : 'Não'}
                                            </span>
                                        )}
                                        {enr.mei != null && (
                                            <span className={`flex-1 text-center py-1 rounded-lg text-[10px] font-medium border ${enr.mei ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'bg-slate-800/60 text-slate-500 border-slate-700'}`}>
                                                MEI {enr.mei ? 'Sim' : 'Não'}
                                            </span>
                                        )}
                                    </div>
                                    {enr.companyStatus && (
                                        <InfoRow label="Situação na RF">
                                            <div className="flex items-center gap-1.5">
                                                {enr.companyStatus === 'Ativa'
                                                    ? <CheckCircle2 size={12} className="text-emerald-400" />
                                                    : <XCircle size={12} className="text-red-400" />}
                                                <span className={enr.companyStatus === 'Ativa' ? 'text-emerald-400' : 'text-red-400'}>{enr.companyStatus}</span>
                                            </div>
                                        </InfoRow>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-6 text-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                        {enr?.status === 'failed' ? <XCircle size={18} className="text-red-400" /> : <Clock size={18} className="text-yellow-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 max-w-40">
                                        {enr?.status === 'failed' ? 'Enriquecimento falhou. Tente novamente.' : 'Dados ainda não foram enriquecidos.'}
                                    </p>
                                    <button onClick={handleEnrich} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300 hover:bg-indigo-600/30 transition-all">
                                        <RefreshCw size={11} /> Enriquecer agora
                                    </button>
                                </div>
                            )}
                        </Card>

                        {/* Data Quality */}
                        {dq && (
                            <Card title="Qualidade dos Dados">
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] text-slate-500">Completude</span>
                                            <span className="text-xs font-bold text-white">{dq.completeness}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${qualityColor(dq.completeness)}`} style={{ width: `${dq.completeness}%` }} />
                                        </div>
                                    </div>

                                    {dq.flags.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            {dq.flags.map((f) => (
                                                <div key={f} className="flex items-center gap-2 text-[11px] text-yellow-400/80">
                                                    <AlertTriangle size={11} className="shrink-0" />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {dq.addressDiscrepancy && (
                                        <div className="flex items-start gap-2 bg-red-500/10 rounded-xl p-2.5 border border-red-500/20">
                                            <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                            <p className="text-[11px] text-red-300">{dq.addressDiscrepancy}</p>
                                        </div>
                                    )}
                                    {dq.flags.length === 0 && !dq.addressDiscrepancy && (
                                        <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                                            <CheckCircle2 size={12} /> Nenhum problema detectado
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ─ RIGHT: Activity Timeline (col-span-3) ─ */}
                    <div className="col-span-12 lg:col-span-3">
                        <Card title="Atividades" extra={
                            <button onClick={() => setShowAddActivity(true)}
                                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                <Plus size={11} /> Adicionar
                            </button>
                        }>
                            <div className="relative flex flex-col gap-0">
                                {/* vertical line */}
                                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-800" />

                                {(lead.activities ?? []).map((act, idx) => (
                                    <div key={act.id} className={`relative flex gap-3 pb-5 ${idx === (lead.activities?.length ?? 1) - 1 ? 'pb-0' : ''}`}>
                                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center z-10 border ${act.type === 'created' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' :
                                                act.type === 'call' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                                    act.type === 'email' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                                        act.type === 'note' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                                                            'bg-slate-700 border-slate-600 text-slate-400'
                                            }`}>
                                            {ACTIVITY_ICONS[act.type]}
                                        </div>
                                        <div className="flex-1 pt-0.5 min-w-0">
                                            <p className="text-[11px] text-slate-300 leading-snug">{act.description}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] text-slate-600">{act.user}</span>
                                                <span className="text-[10px] text-slate-700">·</span>
                                                <span className="text-[10px] text-slate-600">{relativeTime(act.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!lead.activities || lead.activities.length === 0) && (
                                    <p className="text-xs text-slate-600 text-center py-6">Nenhuma atividade ainda.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════ */}

            {/* Status Modal */}
            {showStatusModal && (
                <Modal title="Alterar Status" onClose={() => setShowStatusModal(false)}>
                    <p className="text-xs text-slate-500 mb-4">Selecione o novo status para este lead:</p>
                    <div className="flex flex-col gap-2">
                        {ALL_STATUSES.map((s) => (
                            <button key={s} onClick={() => handleStatusChange(s)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-sm ${lead.status === s ? STATUS_COLORS[s] : 'border-slate-700 text-slate-300 hover:bg-slate-800/60'
                                    }`}>
                                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                                {s}
                                {lead.status === s && <span className="ml-auto text-[10px] opacity-60">atual</span>}
                            </button>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <Modal title="Excluir Lead" onClose={() => setShowDeleteConfirm(false)}>
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                            <Trash2 size={16} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white mb-1">Tem certeza que deseja excluir este lead?</p>
                            <p className="text-xs text-slate-500">Esta ação não pode ser desfeita. <strong className="text-white">{lead.name}</strong> será removido permanentemente.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleDelete}
                            className="flex-1 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-sm text-white font-medium transition-all">
                            Excluir Lead
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add Activity */}
            {showAddActivity && (
                <Modal title="Adicionar Atividade" onClose={() => setShowAddActivity(false)}>
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {ACTIVITY_TYPES.map(({ value, label }) => (
                            <button key={value} onClick={() => setActivityType(value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${activityType === value ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'border-slate-700 text-slate-400 hover:text-white'
                                    }`}>
                                {ACTIVITY_ICONS[value]} {label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={activityText}
                        onChange={(e) => setActivityText(e.target.value)}
                        placeholder="Descreva a atividade..."
                        rows={4}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 resize-none mb-4"
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setShowAddActivity(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleAddActivity} disabled={!activityText.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm text-white font-medium transition-all">
                            Salvar
                        </button>
                    </div>
                </Modal>
            )}

            {/* Edit Modal (simplified) */}
            {showEdit && (
                <Modal title="Editar Lead" onClose={() => setShowEdit(false)}>
                    <div className="flex flex-col gap-3 mb-4">
                        {[
                            { label: 'Nome', key: 'name', value: lead.name },
                            { label: 'Telefone', key: 'phone', value: lead.phone ?? '' },
                            { label: 'E-mail', key: 'email', value: lead.email ?? '' },
                            { label: 'Website', key: 'website', value: lead.website ?? '' },
                        ].map(({ label, key, value }) => (
                            <div key={key}>
                                <label className="text-[11px] text-slate-500 block mb-1">{label}</label>
                                <input
                                    type="text" defaultValue={value}
                                    onChange={(e) => setLead({ ...lead, [key]: e.target.value })}
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/70"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowEdit(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white transition-all">
                            Cancelar
                        </button>
                        <button onClick={() => setShowEdit(false)}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition-all">
                            Salvar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

/* ── Modal wrapper ─────────────────────────────────────── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl w-full max-w-md fade-in shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    )
}

/* ── Loading skeleton ──────────────────────────────────── */
function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14">
            <div className="max-w-[1400px] mx-auto px-4 py-6">
                <div className="animate-pulse flex flex-col gap-5">
                    <div className="h-4 w-48 bg-slate-800 rounded" />
                    <div className="glass rounded-2xl p-5 h-28" />
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-5 glass rounded-2xl h-64" />
                        <div className="col-span-4 glass rounded-2xl h-64" />
                        <div className="col-span-3 glass rounded-2xl h-64" />
                    </div>
                </div>
            </div>
        </div>
    )
}
