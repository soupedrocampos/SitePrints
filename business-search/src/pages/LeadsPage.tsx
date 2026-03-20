import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
    Users, Search, Download, Filter, 
    BarChart3, RefreshCw, Send, Plus, 
    Trash2, CheckCircle2, AlertCircle, X,
    LayoutGrid, List as ListIcon, Database,
    Info
} from 'lucide-react'
import { leadsService } from '../services/leads'
import { LeadsTable } from '../components/leads/LeadsTable'
import { LeadsCards } from '../components/leads/LeadsCards'
import { LeadsSidebar } from '../components/leads/LeadsSidebar'
import type { Lead, LeadFilters } from '../types'
import { LeadProgressBar } from '../components/leads/LeadProgressBar'

export function LeadsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [leads, setLeads] = useState<Lead[]>([])
    const [totalLeads, setTotalLeads] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    
    // Stats
    const [stats, setStats] = useState({
        total: 0,
        enriched: 0,
        pending: 0,
        websiteCount: 0
    })

    // Active session filtering info from URL
    const sessionIdFilter = searchParams.get('search')?.startsWith('mass-') || searchParams.get('search')?.startsWith('simple-')
        ? searchParams.get('search') : null

    const [filters, setFilters] = useState<LeadFilters>({
        search: searchParams.get('search') || '',
        statuses: [],
        sources: [],
        dateFrom: '',
        dateTo: '',
        enriched: null,
        qualityMin: 0,
        qualityMax: 100,
        onlyWithWebsite: false,
        sessionId: sessionIdFilter || undefined
    })

    useEffect(() => {
        fetchLeads()
    }, [filters, searchParams])

    const fetchLeads = async () => {
        setIsLoading(true)
        try {
            const currentSearch = searchParams.get('search') || ''
            const updatedFilters = { ...filters, search: currentSearch }
            
            const response = await leadsService.getLeads(updatedFilters as any)
            setLeads(response.data)
            setTotalLeads(response.total)

            // Update local stats from all leads (ideally should come from API)
            const allLeads = await leadsService.getLeads({ perPage: 1000 } as any)
            setStats({
                total: allLeads.total,
                enriched: allLeads.data.filter(l => l.enriched).length,
                pending: allLeads.data.filter(l => !l.enriched).length,
                websiteCount: allLeads.data.filter(l => l.website && l.website.trim() !== '').length
            })
        } catch (error) {
            console.error('Fetch leads error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const clearSessionFilter = () => {
        setSearchParams({})
        setFilters(prev => ({ ...prev, search: '', sessionId: undefined }))
    }

    const handleExport = async () => {
        try {
            const blob = await leadsService.exportCSV(filters as any)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (error) {
            console.error('Export error:', error)
        }
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
            {/* Sidebar Controls */}
            <aside className="w-full xl:w-80 shrink-0">
                <LeadsSidebar filters={filters} onFilterChange={setFilters} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 space-y-8 min-w-0">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Lead Center</h1>
                            </div>
                            <p className="text-slate-500 font-medium">Gerencie e analise seu funil de prospecção</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={fetchLeads}
                                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                                title="Atualizar dados"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2.5 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all hover:border-indigo-500 hover:text-indigo-600 shadow-sm active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Exportar
                            </button>
                            <button className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95">
                                <Send className="w-4 h-4" />
                                CRM Interno
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Mini-Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                        {[
                            { label: 'Total Base', value: stats.total, icon: Database, color: 'blue' },
                            { label: 'Com Website', value: `${stats.websiteCount}`, icon: Globe, color: 'emerald' },
                            { label: 'Analisados', value: stats.enriched, icon: CheckCircle2, color: 'indigo' },
                            { label: 'Aguardando', value: stats.pending, icon: AlertCircle, color: 'amber' },
                        ].map((stat, i) => (
                            <div key={i} className="group p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-none">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 bg-${stat.color}-500/10 rounded-lg group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest text-${stat.color}-600/60`}>Live</span>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stat.value}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Session Active Filter Banner */}
                    {sessionIdFilter && (
                        <div className="mt-8 bg-indigo-600 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 text-white shadow-xl shadow-indigo-600/20 border border-indigo-400/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Visualizando resultados de sessão específica</h4>
                                    <p className="text-xs text-indigo-100 font-medium">Você está visualizando apenas os leads capturados na sessão <span className="font-mono bg-white/10 px-1 rounded">{sessionIdFilter}</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={clearSessionFilter}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
                            >
                                <X className="w-4 h-4" />
                                Limpar Filtro
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Leads List Container */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/10">
                    {/* View Toolbar */}
                    <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className="hidden sm:flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <ListIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 ml-2">
                                Listagem de Leads 
                                <span className="ml-3 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-black uppercase tracking-wider">{totalLeads}</span>
                            </h3>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedLeads.length > 0 && (
                                <>
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all">
                                        Analisar em Massa ({selectedLeads.length})
                                    </button>
                                    <button className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="min-h-[500px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full" />
                                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
                                </div>
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Carregando Leads...</span>
                            </div>
                        ) : leads.length > 0 ? (
                            viewMode === 'table' ? (
                                <LeadsTable 
                                    leads={leads} 
                                    selectedItems={selectedLeads}
                                    onSelectItems={setSelectedLeads}
                                    onUpdate={() => fetchLeads()}
                                />
                            ) : (
                                <div className="p-8">
                                    <LeadsCards leads={leads} />
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-6">
                                <div className="p-10 bg-slate-50 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Users className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nenhum lead encontrado</h4>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">Tente ajustar seus filtros ou inicie uma nova busca para capturar contatos.</p>
                                </div>
                                <button className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform">
                                    <Search className="w-4 h-4" />
                                    Ir para Busca
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
