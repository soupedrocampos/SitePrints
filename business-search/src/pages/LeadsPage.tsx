import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
    Search, Plus, Download, Table2, LayoutGrid,
    Columns, ChevronDown, Users, Star, TrendingUp, Code, Globe
} from 'lucide-react'
import { Lead, LeadFilters, LeadStatus, SortField, SortDir } from '../types/lead'
import { exportToCSV } from '../lib/leadHelpers'
import axios from 'axios'
import LeadsSidebar from '../components/leads/LeadsSidebar'
import LeadsTable from '../components/leads/LeadsTable'
import LeadsCards from '../components/leads/LeadsCards'
import BulkActionsBar from '../components/leads/BulkActionsBar'
import LeadModal from '../components/leads/LeadModal'
import LeadsEmptyState from '../components/leads/LeadsEmptyState'
import { useLeads, useUpdateLead, useDeleteLead, useBulkUpdateStatus } from '../hooks/useLeads'
import { searchHistoryService, SearchHistoryItem } from '../services/searchHistory'
import { formatLocationWithFlag } from '../utils/flags'

const DEFAULT_FILTERS: LeadFilters = {
    search: '', statuses: [], sources: [], dateFrom: '', dateTo: '',
    enriched: null, qualityMin: 0, qualityMax: 100,
    onlyWithWebsite: false,
}

const DEFAULT_COLS = new Set(['name', 'whatsapp', 'status', 'quality', 'city', 'created_at', 'actions'])

const ALL_COL_LABELS: Record<string, string> = {
    name: 'Empresa', whatsapp: 'WhatsApp', status: 'Status', quality: 'Score',
    city: 'Cidade/UF', created_at: 'Criado em', actions: 'Ações',
}

export default function LeadsPage() {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [searchParams] = useSearchParams()
    const urlSessionId = searchParams.get('search')

    const [filters, setFilters] = useState<LeadFilters>(() => ({
        ...DEFAULT_FILTERS,
        sessionId: urlSessionId || undefined
    }))
    
    // Buscar infos da sessão se ela existir
    const currentSession = useMemo(() => {
        if (!urlSessionId) return null
        const history = searchHistoryService.getHistory()
        return history.find(h => h.sessionId === urlSessionId) || null
    }, [urlSessionId])
    const [sortField, setSortField] = useState<SortField>('created_at')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(false)
    const navigate = useNavigate()

    // Fetch leads from localStorage via hook
    const { data: leadsData, isLoading } = useLeads({
        page,
        perPage,
        search: filters.search,
        status: filters.statuses,
        source: filters.sources,
        onlyWithWebsite: filters.onlyWithWebsite,
        sessionId: filters.sessionId,
        sortBy: sortField === 'quality' ? 'qualityScore' : sortField === 'created_at' ? 'createdAt' : 'companyName' as any,
        sortDir
    })

    const leads = leadsData?.data || []
    const totalLeads = leadsData?.total || 0

    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_COLS)
    const [showColDropdown, setShowColDropdown] = useState(false)
    const [activeModal, setActiveModal] = useState<{ lead: Lead; mode: 'view' | 'edit' } | null>(null)
    const [showExportOptions, setShowExportOptions] = useState(false)

    // Mutations
    const updateMutation = useUpdateLead()
    const deleteMutation = useDeleteLead()
    const bulkStatusMutation = useBulkUpdateStatus()

    const handleSort = (field: SortField) => {
        if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        else { setSortField(field); setSortDir('asc') }
        setPage(1)
    }

    const handleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const handleSelectAll = (all: boolean) => {
        const pageIds = leads.map((l) => l.id)
        setSelected(all ? new Set(pageIds) : new Set())
    }

    const handleBulkStatus = async (status: LeadStatus) => {
        await bulkStatusMutation.mutateAsync({ ids: Array.from(selected), status })
        setSelected(new Set())
    }

    const handleBulkDelete = async () => {
        for (const id of Array.from(selected)) {
            await deleteMutation.mutateAsync(id)
        }
        setSelected(new Set())
    }

    const handleDelete = async (id: string) => {
        await deleteMutation.mutateAsync(id)
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    }

    const handleSave = async (updated: Lead) => {
        await updateMutation.mutateAsync({ id: updated.id, payload: updated as any })
        setActiveModal(null)
    }

    const handleAnalyzeBatch = useCallback(() => {
        const selectedLeads = leads.filter(l => selected.has(l.id))
        const analysisData = selectedLeads.map(l => ({
            id: l.id,
            businessName: l.name,
            website: l.website || '',
            rating: (l.quality || 0) / 20,
            ratingCount: Math.floor(Math.random() * 100)
        })).filter(l => !!l.website)

        if (analysisData.length === 0) {
            alert('Selecione leads que possuam website para analisar.')
            return
        }

        sessionStorage.setItem('pending_analysis', JSON.stringify(analysisData))
        navigate('/analysis')
    }, [leads, selected, navigate])

    // Deduplication: keep the first encountered lead per unique name+phone combination
    const handleDeduplicateAll = useCallback(() => {
        const raw = localStorage.getItem('crm_leads')
        if (!raw) return
        const allLeads: Lead[] = JSON.parse(raw)
        const seen = new Set<string>()
        const deduped = allLeads.filter(lead => {
            const key = `${lead.name.toLowerCase().trim()}|${(lead.phone || '').replace(/\D/g, '')}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        const removed = allLeads.length - deduped.length
        localStorage.setItem('crm_leads', JSON.stringify(deduped))
        setSelected(new Set())
        // Force react-query to refetch by dispatching a storage event
        window.dispatchEvent(new Event('storage'))
        alert(`Duplicados removidos: ${removed} lead${removed !== 1 ? 's' : ''} eliminado${removed !== 1 ? 's' : ''}.`)
    }, [])

    // WhatsApp validation: calls backend to verify selected phone numbers
    const handleCheckWhatsApp = useCallback(async () => {
        if (isCheckingWhatsApp) return
        const selectedLeads = leads.filter(l => selected.has(l.id) && l.phone)
        if (selectedLeads.length === 0) {
            alert('Selecione leads com telefone cadastrado para verificar WhatsApp.')
            return
        }
        setIsCheckingWhatsApp(true)

        // Mark selected leads as 'checking'
        const raw = localStorage.getItem('crm_leads')
        const allLeads: Lead[] = raw ? JSON.parse(raw) : []
        const updatedChecking = allLeads.map(l =>
            selected.has(l.id) && l.phone ? { ...l, whatsappStatus: 'checking' as const } : l
        )
        localStorage.setItem('crm_leads', JSON.stringify(updatedChecking))
        window.dispatchEvent(new Event('storage'))

        // Call backend for each lead
        const results: Record<string, 'valid' | 'invalid'> = {}
        for (const lead of selectedLeads) {
            try {
                const phone = lead.phone!.replace(/\D/g, '')
                const res = await axios.post('http://localhost:3002/api/check-whatsapp', {
                    phones: [phone]
                })
                const status = res.data?.results?.[phone]
                results[lead.id] = status === 'valid' ? 'valid' : 'invalid'
            } catch {
                results[lead.id] = 'invalid'
            }
        }

        // Persist results
        const rawFinal = localStorage.getItem('crm_leads')
        const allFinal: Lead[] = rawFinal ? JSON.parse(rawFinal) : []
        const updated = allFinal.map(l => results[l.id] !== undefined ? { ...l, whatsappStatus: results[l.id] } : l)
        localStorage.setItem('crm_leads', JSON.stringify(updated))
        window.dispatchEvent(new Event('storage'))
        setIsCheckingWhatsApp(false)
    }, [leads, selected, isCheckingWhatsApp])

    const clearFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setPage(1) }, [])

    const toggleCol = (col: string) => {
        setVisibleCols((prev) => {
            const next = new Set(prev)
            next.has(col) ? next.delete(col) : next.add(col)
            return next
        })
    }

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(leadsData?.data || [], null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const stats = {
        total: totalLeads,
        enriched: leads.filter((l) => l.enriched).length,
        withoutWebsite: leads.filter((l) => !l.website || l.website.trim() === '').length,
        avgQuality: Math.round(leads.reduce((s, l) => s + (l.quality || 0), 0) / (leads.length || 1)),
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/6 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users size={18} className="text-indigo-400" />
                                Meus Leads
                                <span className="text-sm font-normal text-slate-500 ml-1">({totalLeads})</span>
                            </h1>
                            {currentSession ? (
                                <p className="text-sm text-indigo-300 mt-2 flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 w-fit">
                                    <Search size={14} className="text-indigo-400" />
                                    Buscando leads de: <span className="text-white font-medium">{currentSession.query}</span>
                                    <span className="opacity-50">•</span>
                                    em <span className="text-white font-medium">{formatLocationWithFlag(currentSession.location)}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-slate-500 mt-0.5">Gerencie e qualifique seus contatos</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Nome, CNPJ ou cidade..."
                                    value={filters.search}
                                    onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }}
                                    className="bg-slate-800/60 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 w-52"
                                />
                            </div>

                            {/* View toggle */}
                            <div className="flex border border-slate-700 rounded-xl overflow-hidden">
                                <button onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 text-xs transition-colors ${viewMode === 'table' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-500 hover:text-white'}`}>
                                    <Table2 size={13} />
                                </button>
                                <button onClick={() => setViewMode('cards')}
                                    className={`px-3 py-2 text-xs transition-colors ${viewMode === 'cards' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-500 hover:text-white'}`}>
                                    <LayoutGrid size={13} />
                                </button>
                            </div>

                            {/* Column visibility */}
                            {viewMode === 'table' && (
                                <div className="relative">
                                    <button onClick={() => setShowColDropdown(!showColDropdown)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
                                        <Columns size={12} />
                                        Colunas
                                        <ChevronDown size={10} />
                                    </button>
                                    {showColDropdown && (
                                        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2 z-20 shadow-xl min-w-36">
                                            {Object.entries(ALL_COL_LABELS).map(([id, label]) => (
                                                <label key={id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-700/40 rounded-lg">
                                                    <input type="checkbox" checked={visibleCols.has(id)} onChange={() => toggleCol(id)}
                                                        className="accent-indigo-500 w-3 h-3" />
                                                    <span className="text-xs text-slate-300">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Export */}
                            <div className="relative">
                                <button onClick={() => setShowExportOptions(!showExportOptions)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
                                    <Download size={12} />
                                    Exportar
                                    <ChevronDown size={10} />
                                </button>
                                {showExportOptions && (
                                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-1 z-20 shadow-xl min-w-32">
                                        <button onClick={() => { exportToCSV(leads); setShowExportOptions(false) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors">
                                            <Download size={12} /> CSV
                                        </button>
                                        <button onClick={() => { handleExportJSON(); setShowExportOptions(false) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors">
                                            <Code size={12} /> JSON
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* New Lead */}
                            <Link to="/leads/new"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                                <Plus size={13} />
                                Novo Lead Manual
                            </Link>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                            { icon: <Users size={13} />, label: 'Total Leads', value: stats.total, color: 'text-indigo-400' },
                            { icon: <Star size={13} />, label: 'Enriquecidos', value: stats.enriched, color: 'text-emerald-400' },
                            { icon: <Globe size={13} />, label: 'Sem Website', value: stats.withoutWebsite, color: 'text-red-400' },
                            { icon: <TrendingUp size={13} />, label: 'Score Médio', value: stats.avgQuality, color: 'text-yellow-400' },
                        ].map(({ icon, label, value, color }) => (
                            <div key={label} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <span className={color}>{icon}</span>
                                <div>
                                    <p className="text-base font-bold text-white leading-none">{value}</p>
                                    <p className="text-[10px] text-slate-500">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Main layout */}
                <div className="flex gap-4">
                    {/* Sidebar 20% */}
                    <div className="w-52 shrink-0">
                        <LeadsSidebar leads={leads} filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} />
                    </div>

                    {/* Content 80% */}
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                        {/* Bulk actions */}
                        <BulkActionsBar
                            count={selected.size}
                            onChangeStatus={handleBulkStatus}
                            onExport={() => exportToCSV(leads.filter((l) => selected.has(l.id)))}
                            onDelete={handleBulkDelete}
                            onClear={() => setSelected(new Set())}
                            onAnalyze={handleAnalyzeBatch}
                            onDeduplicateAll={handleDeduplicateAll}
                            onCheckWhatsApp={handleCheckWhatsApp}
                            isCheckingWhatsApp={isCheckingWhatsApp}
                        />

                        {/* Content */}
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                        ) : totalLeads === 0 ? (
                            <LeadsEmptyState mode="no-leads" />
                        ) : leads.length === 0 ? (
                            <LeadsEmptyState mode="no-results" onClearFilters={clearFilters} />
                        ) : viewMode === 'table' ? (
                            <LeadsTable
                                leads={leads}
                                selected={selected}
                                onSelect={handleSelect}
                                onSelectAll={handleSelectAll}
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={handleSort}
                                onView={(l) => setActiveModal({ lead: l, mode: 'view' })}
                                onEdit={(l) => setActiveModal({ lead: l, mode: 'edit' })}
                                onDelete={handleDelete}
                                visibleCols={visibleCols}
                                page={page}
                                perPage={perPage}
                                totalLeads={totalLeads}
                                onPageChange={setPage}
                                onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
                            />
                        ) : (
                            <LeadsCards
                                leads={leads}
                                onView={(l) => setActiveModal({ lead: l, mode: 'view' })}
                                onEdit={(l) => setActiveModal({ lead: l, mode: 'edit' })}
                                onDelete={handleDelete}
                                page={page}
                                perPage={perPage}
                                totalLeads={totalLeads}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {activeModal && (
                <LeadModal
                    lead={activeModal.lead}
                    mode={activeModal.mode}
                    onClose={() => setActiveModal(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}
