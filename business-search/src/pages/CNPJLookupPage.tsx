import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Search, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
    Building2, X, ChevronDown, ExternalLink, Loader2, Users, Plus,
} from 'lucide-react'
import {
    maskCNPJInput, stripCNPJ, isValidCNPJ,
    fetchByCNPJ, searchByName, CompanyData, NameSearchResult,
} from '../lib/cnpjUtils'
import { mockLeads } from '../lib/mockLeads'
import { STATUS_COLORS } from '../lib/leadHelpers'

/* ── Toast ───────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning'
interface ToastMsg { id: string; type: ToastType; msg: string }

const STATES = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
    'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

/* ── Status badge color ──────────────────────────────── */
function statusBadge(status: CompanyData['status']) {
    switch (status) {
        case 'Ativa': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        case 'Inativa': return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'Baixada': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        case 'Suspensa': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
}

function confidenceColor(n: number) {
    if (n >= 90) return 'bg-emerald-500'
    if (n >= 70) return 'bg-yellow-500'
    return 'bg-orange-500'
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function CNPJLookupPage() {
    const navigate = useNavigate()

    // Step 1 – lookup
    const [cnpjInput, setCnpjInput] = useState('')
    const [cnpjError, setCnpjError] = useState('')
    const [step, setStep] = useState<'lookup' | 'preview' | 'not-found' | 'api-error'>('lookup')
    const [searching, setSearching] = useState(false)
    const [company, setCompany] = useState<CompanyData | null>(null)

    // Name search modal
    const [showNameSearch, setShowNameSearch] = useState(false)
    const [nameQuery, setNameQuery] = useState('')
    const [nameState, setNameState] = useState('')
    const [nameResults, setNameResults] = useState<NameSearchResult[]>([])
    const [nameSearching, setNameSearching] = useState(false)
    const [selectedResult, setSelectedResult] = useState<NameSearchResult | null>(null)
    const [nameSearchDone, setNameSearchDone] = useState(false)

    // Confirm modal
    const [showConfirm, setShowConfirm] = useState(false)
    const [creating, setCreating] = useState(false)

    // Toast
    const [toasts, setToasts] = useState<ToastMsg[]>([])
    const addToast = (type: ToastType, msg: string) => {
        const id = Date.now().toString()
        setToasts((t) => [...t, { id, type, msg }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    }

    // Already-exists check
    const existingLead = company
        ? mockLeads.find((l) => l.cnpj.replace(/\D/g, '') === stripCNPJ(company.cnpj))
        : null

    /* ── Input handler ────────────────────────────────── */
    const handleCNPJChange = (raw: string) => {
        const masked = maskCNPJInput(raw)
        setCnpjInput(masked)
        setCnpjError('')
        if (stripCNPJ(masked).length === 14 && !isValidCNPJ(stripCNPJ(masked))) {
            setCnpjError('CNPJ inválido — verifique os dígitos verificadores')
        }
    }

    const canSearch = isValidCNPJ(stripCNPJ(cnpjInput)) && !searching

    /* ── Lookup ───────────────────────────────────────── */
    const doLookup = async (cnpj: string) => {
        setSearching(true)
        try {
            const data = await fetchByCNPJ(cnpj)
            setCompany(data)
            setStep('preview')
        } catch (_) {
            setStep('api-error')
        } finally {
            setSearching(false)
        }
    }

    /* ── Name search ──────────────────────────────────── */
    const doNameSearch = async () => {
        if (!nameQuery.trim()) return
        setNameSearching(true)
        setNameSearchDone(false)
        setNameResults([])
        setSelectedResult(null)
        const results = await searchByName(nameQuery, nameState)
        setNameResults(results)
        setNameSearchDone(true)
        setNameSearching(false)
    }

    const handleSelectFromName = () => {
        if (!selectedResult) return
        setShowNameSearch(false)
        setCnpjInput(selectedResult.cnpj)
        setNameQuery(''); setNameState(''); setNameResults([]); setNameSearchDone(false); setSelectedResult(null)
        doLookup(selectedResult.cnpj)
    }

    /* ── Create lead ──────────────────────────────────── */
    const handleCreateLead = async () => {
        setCreating(true)
        await new Promise((r) => setTimeout(r, 900))
        setCreating(false)
        setShowConfirm(false)
        addToast('success', `Lead "${company?.tradeName || company?.legalName}" criado com sucesso!`)
        setTimeout(() => navigate('/leads'), 1600)
    }

    const handleNewSearch = () => {
        setStep('lookup')
        setCnpjInput('')
        setCnpjError('')
        setCompany(null)
    }

    const isActive = company?.status === 'Ativa'

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14 flex flex-col items-center px-4 py-8">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl" />
            </div>

            {/* Toast */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-xl fade-in max-w-xs ${t.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-300' :
                            t.type === 'error' ? 'bg-red-900/80 border-red-500/40 text-red-300' :
                                'bg-yellow-900/80 border-yellow-500/40 text-yellow-300'
                        }`}>
                        {t.type === 'success' ? <CheckCircle2 size={15} /> : t.type === 'error' ? <XCircle size={15} /> : <AlertTriangle size={15} />}
                        {t.msg}
                    </div>
                ))}
            </div>

            <div className="relative z-10 w-full max-w-[600px]">
                {/* Back nav */}
                <Link to="/leads" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white mb-5 transition-colors">
                    <ArrowLeft size={14} />
                    Voltar para Meus Leads
                </Link>

                {/* ── STEP 1: LOOKUP ── */}
                {(step === 'lookup' || step === 'not-found' || step === 'api-error') && (
                    <div className="glass rounded-2xl overflow-hidden fade-in">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                                <Search size={16} className="text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-white">Buscar Empresa por CNPJ</h1>
                                <p className="text-xs text-slate-500">Insira um CNPJ para importar os dados da empresa</p>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                            {/* Error banners */}
                            {step === 'not-found' && (
                                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 fade-in">
                                    <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-300">CNPJ não encontrado</p>
                                        <p className="text-xs text-red-400/70 mt-0.5">Verifique o número digitado ou tente buscar por nome.</p>
                                    </div>
                                </div>
                            )}
                            {step === 'api-error' && (
                                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3.5 fade-in">
                                    <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-yellow-300">Erro na consulta</p>
                                        <p className="text-xs text-yellow-400/70 mt-0.5">Não foi possível conectar à API. Tente novamente.</p>
                                    </div>
                                    <button onClick={() => doLookup(cnpjInput)}
                                        className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                                        <RefreshCw size={12} /> Tentar
                                    </button>
                                </div>
                            )}

                            {/* CNPJ Input */}
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-2">CNPJ</label>
                                <div className="relative">
                                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={cnpjInput}
                                        onChange={(e) => handleCNPJChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && canSearch && doLookup(cnpjInput)}
                                        placeholder="00.000.000/0000-00"
                                        maxLength={18}
                                        className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors ${cnpjError ? 'border-red-500/60 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500/70'
                                            }`}
                                    />
                                    {cnpjInput && (
                                        <button onClick={() => { setCnpjInput(''); setCnpjError('') }}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Error / hint */}
                                {cnpjError ? (
                                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                        <XCircle size={11} /> {cnpjError}
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-slate-600 mt-1.5">
                                        Formato: XX.XXX.XXX/XXXX-XX
                                        {isValidCNPJ(stripCNPJ(cnpjInput)) && (
                                            <span className="ml-2 text-emerald-500 inline-flex items-center gap-0.5">
                                                <CheckCircle2 size={10} /> CNPJ válido
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Buscar button */}
                            <button
                                onClick={() => doLookup(cnpjInput)}
                                disabled={!canSearch}
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {searching ? <><Loader2 size={15} className="animate-spin" /> Consultando...</> : <><Search size={15} /> Buscar Empresa</>}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-[11px] text-slate-600">ou</span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>

                            {/* Name search link */}
                            <button
                                onClick={() => setShowNameSearch(true)}
                                className="w-full py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all flex items-center justify-center gap-2"
                            >
                                <Users size={14} />
                                Buscar por Nome da Empresa
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: PREVIEW ── */}
                {step === 'preview' && company && (
                    <div className="flex flex-col gap-4 fade-in">
                        {/* Success banner */}
                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-300">Empresa encontrada!</p>
                                <p className="text-[11px] text-emerald-400/70">Dados consultados com sucesso. Verifique as informações abaixo.</p>
                            </div>
                        </div>

                        {/* Inactive warning */}
                        {!isActive && (
                            <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3">
                                <AlertTriangle size={15} className="text-yellow-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-yellow-300">
                                    ⚠️ Esta empresa não está ativa — situação: <strong>{company.status}</strong>. Considere isso antes de criar o lead.
                                </p>
                            </div>
                        )}

                        {/* Already exists */}
                        {existingLead && (
                            <div className="flex items-center justify-between gap-3 bg-blue-500/10 border border-blue-500/25 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-blue-400 shrink-0" />
                                    <p className="text-xs text-blue-300">Este CNPJ já existe como lead na sua lista.</p>
                                </div>
                                <Link to={`/leads/${existingLead.id}`}
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                                    Ver Lead <ExternalLink size={11} />
                                </Link>
                            </div>
                        )}

                        {/* Company card */}
                        <div className="glass rounded-2xl overflow-hidden">
                            {/* Header strip */}
                            <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusBadge(company.status)}`}>
                                            {company.status}
                                        </span>
                                        {existingLead && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium">
                                                Já importado
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-base font-bold text-white leading-tight">{company.legalName}</h2>
                                    {company.tradeName && <p className="text-xs text-slate-400 mt-0.5">Nome fantasia: {company.tradeName}</p>}
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Building2 size={20} className="text-indigo-400" />
                                </div>
                            </div>

                            {/* Info rows */}
                            <div className="px-6 py-4">
                                {[
                                    { label: 'CNPJ', value: company.cnpj, mono: true },
                                    { label: 'CNAE Principal', value: `${company.cnaeCode} — ${company.cnaePrimary}` },
                                    { label: 'Porte', value: company.companySize },
                                    { label: 'Natureza Jurídica', value: company.legalNature },
                                    { label: 'Fundação', value: company.foundingDate },
                                    { label: 'Endereço', value: `${company.address} — ${company.city}, ${company.state}` },
                                ].map(({ label, value, mono }) => (
                                    <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800/50 last:border-0">
                                        <span className="text-[11px] text-slate-500 shrink-0 pt-0.5">{label}</span>
                                        <span className={`text-xs text-white text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleNewSearch}
                                className="flex-1 py-3 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                            >
                                Nova Busca
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!!existingLead}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                <Plus size={15} />
                                {existingLead ? 'Lead já existe' : 'Criar Lead'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ════ NAME SEARCH MODAL ════ */}
            {showNameSearch && (
                <ModalWrap title="Buscar por Nome" onClose={() => { setShowNameSearch(false); setNameQuery(''); setNameResults([]); setNameSearchDone(false); setSelectedResult(null) }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[11px] text-slate-500 block mb-1">Nome da empresa</label>
                                <input
                                    type="text"
                                    value={nameQuery}
                                    onChange={(e) => setNameQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && doNameSearch()}
                                    placeholder="Ex: Famiglia Mancini, Tech Solutions..."
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70"
                                />
                            </div>
                            <div className="w-28">
                                <label className="text-[11px] text-slate-500 block mb-1">UF</label>
                                <select
                                    value={nameState}
                                    onChange={(e) => setNameState(e.target.value)}
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/70"
                                >
                                    <option value="">Todos</option>
                                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <button onClick={doNameSearch} disabled={!nameQuery.trim() || nameSearching}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-medium text-white transition-all flex items-center justify-center gap-2">
                            {nameSearching ? <><Loader2 size={14} className="animate-spin" /> Buscando...</> : <><Search size={14} /> Buscar</>}
                        </button>

                        {/* Results */}
                        {nameSearchDone && (
                            <div className="fade-in">
                                {nameResults.length === 0 ? (
                                    <p className="text-center text-xs text-slate-500 py-6">Nenhuma empresa encontrada para "{nameQuery}"</p>
                                ) : (
                                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                        {nameResults.map((r) => (
                                            <label key={r.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedResult?.id === r.id ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-700/60 hover:border-slate-600'}`}>
                                                <input type="radio" name="company-result" value={r.id}
                                                    checked={selectedResult?.id === r.id}
                                                    onChange={() => setSelectedResult(r)}
                                                    className="mt-0.5 accent-indigo-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white leading-snug">{r.legalName}</p>
                                                    {r.tradeName && <p className="text-[10px] text-slate-500">{r.tradeName}</p>}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="font-mono text-[10px] text-slate-400">{r.cnpj}</span>
                                                        <span className="text-[10px] text-slate-600">·</span>
                                                        <span className="text-[10px] text-slate-500">{r.city}, {r.state}</span>
                                                    </div>
                                                </div>
                                                {/* Confidence */}
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-[10px] text-slate-500">match</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${confidenceColor(r.confidence)}`} style={{ width: `${r.confidence}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">{r.confidence}%</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {nameSearchDone && nameResults.length > 0 && (
                            <div className="flex gap-3">
                                <button onClick={() => { setShowNameSearch(false); setNameSearchDone(false); setNameResults([]); setSelectedResult(null) }}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleSelectFromName} disabled={!selectedResult}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-medium text-white transition-all">
                                    Selecionar empresa
                                </button>
                            </div>
                        )}
                    </div>
                </ModalWrap>
            )}

            {/* ════ CONFIRM CREATE LEAD MODAL ════ */}
            {showConfirm && company && (
                <ModalWrap title="Criar Lead" onClose={() => !creating && setShowConfirm(false)}>
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Plus size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white mb-0.5">Deseja criar um lead para esta empresa?</p>
                            <p className="text-xs text-slate-500">Um novo registro será adicionado à sua lista de leads.</p>
                        </div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-3.5 mb-5 flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-white">{company.legalName}</p>
                        {company.tradeName && <p className="text-[11px] text-slate-400">{company.tradeName}</p>}
                        <p className="font-mono text-[11px] text-slate-500">{company.cnpj}</p>
                        <span className={`self-start mt-0.5 text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusBadge(company.status)}`}>
                            {company.status}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirm(false)} disabled={creating}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white disabled:opacity-40 transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleCreateLead} disabled={creating}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2">
                            {creating ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : <><CheckCircle2 size={14} /> Confirmar</>}
                        </button>
                    </div>
                </ModalWrap>
            )}
        </div>
    )
}

/* ── Shared modal wrapper ────────────────────────────── */
function ModalWrap({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
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
