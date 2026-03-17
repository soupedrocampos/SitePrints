import { useState, useCallback, useEffect } from 'react'
import { Building2, Sparkles, BarChart3, Users, Download, PlusCircle, Loader2 } from 'lucide-react'
import SearchForm from '../components/SearchForm'
import MassSearch from '../components/MassSearch'
import BusinessCard from '../components/BusinessCard'
import CardSkeleton from '../components/CardSkeleton'
import DuplicateModal from '../components/DuplicateModal'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import { ToastContainer } from '../components/Toast'
import { Business, BusinessType, Toast } from '../types/business'
import { useCreateLead, useLeads } from '../hooks/useLeads'
import { searchService } from '../services/search'

const PER_PAGE = 6

export default function SearchPage() {
    const [searchResults, setSearchResults] = useState<Business[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [currentLocation, setCurrentLocation] = useState('')
    const [capturedLeads, setCapturedLeads] = useState<Set<string>>(new Set())
    const [duplicateBusiness, setDuplicateBusiness] = useState<Business | null>(null)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [page, setPage] = useState(1)
    const [isCapturingAll, setIsCapturingAll] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('recentSearches') || '[]') } catch { return [] }
    })

    const [searchMode, setSearchMode] = useState<'simple' | 'mass'>('simple')

    const createLeadMutation = useCreateLead()
    const { data: storedLeads } = useLeads({ perPage: 1000 })

    // Sync capturedLeads with localStorage on load/change
    useEffect(() => {
        if (storedLeads?.data) {
            const ids = new Set(storedLeads.data.map(l => l.cnpj)) // Using CNPJ as unique key for simplicity or place_id if stored
            // Actually, we should probably store the place_id in the lead metadata
            // For now, let's just use the phone or name as a fallback if place_id isn't in Lead type
            // But better: let's assume we can match by name + city
            const captureSet = new Set(storedLeads.data.map(l => `${l.name}-${l.city}`))
            setCapturedLeads(captureSet)
        }
    }, [storedLeads])

    const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
        const id = Math.random().toString(36).slice(2)
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }, [])

    const handleSearch = useCallback(async (query: string, location: string, radius: number, types: BusinessType[]) => {
        setIsLoading(true)
        setHasSearched(true)
        setCurrentLocation(location)
        setPage(1)

        // Save to recent searches
        const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))

        try {
            const response = await searchService.searchBusinesses({
                query,
                location,
                radius,
                types: types as string[]
            })

            setSearchResults(response.results)
        } catch (err) {
            console.error('Search failed:', err)
            addToast('Falha na busca. Verifique a conexão com o servidor backend.', 'error')
            setSearchResults([])
        } finally {
            setIsLoading(false)
        }
    }, [recentSearches, addToast])

    const handleMassResults = useCallback((results: Business[]) => {
        setHasSearched(true)
        setSearchResults(results)
        setPage(1)
        addToast(`${results.length} empresas encontradas na busca em massa!`, 'success')
    }, [addToast])

    const captureToDb = async (business: Business) => {
        await createLeadMutation.mutateAsync({
            companyName: business.name,
            cnpj: `00.000.000/0001-${Math.floor(10 + Math.random() * 89)}`, // Simulating CNPJ for captured lead
            address: business.address,
            phone: business.phone || '',
            website: business.website || '',
            source: 'Google Maps',
            city: business.address.split('-').pop()?.trim() || currentLocation,
        })
    }

    const handleCapture = useCallback(async (business: Business) => {
        const key = `${business.name}-${business.address.split('-').pop()?.trim() || currentLocation}`
        if (capturedLeads.has(key)) {
            setDuplicateBusiness(business)
        } else {
            try {
                await captureToDb(business)
                setCapturedLeads((prev) => new Set([...prev, key]))
                addToast(`Lead "${business.name}" capturado com sucesso!`, 'success')
            } catch (err) {
                addToast('Erro ao capturar lead.', 'error')
            }
        }
    }, [capturedLeads, addToast, currentLocation, createLeadMutation])

    const handleCaptureAll = useCallback(async () => {
        if (searchResults.length === 0) return
        setIsCapturingAll(true)
        let count = 0

        for (const business of searchResults) {
            const key = `${business.name}-${business.address.split('-').pop()?.trim() || currentLocation}`
            if (!capturedLeads.has(key)) {
                try {
                    await captureToDb(business)
                    capturedLeads.add(key)
                    count++
                } catch (e) { /* skip errors */ }
            }
        }

        setCapturedLeads(new Set(capturedLeads))
        setIsCapturingAll(false)
        addToast(`${count} novos leads capturados com sucesso!`, 'success')
    }, [searchResults, capturedLeads, currentLocation, addToast])

    const handleDuplicateConfirm = useCallback(() => {
        if (duplicateBusiness) {
            addToast(`Lead "${duplicateBusiness.name}" já está na sua lista.`, 'warning')
            setDuplicateBusiness(null)
        }
    }, [duplicateBusiness, addToast])

    // Pagination
    const totalPages = Math.ceil(searchResults.length / PER_PAGE)
    const paginated = searchResults.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const stats = {
        total: searchResults.length,
        accessible: searchResults.filter((b) => b.accessible).length,
        captured: capturedLeads.size,
        storedTotal: storedLeads?.total || 0
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e]">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute -top-40 right-1/3 w-80 h-80 bg-cyan-600/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">

                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                            <Building2 size={18} className="text-indigo-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Business Search</h1>
                        <span className="text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">CRM</span>
                    </div>
                    <p className="text-sm text-slate-500 ml-12">Busque empresas e capture leads com inteligência</p>
                </header>

                {/* Stats bar (only after search) */}
                {hasSearched && !isLoading && (
                    <div className="grid grid-cols-3 gap-3 mb-6 fade-in">
                        {[
                            { icon: <Building2 size={14} />, label: 'Encontradas', value: stats.total, color: 'text-indigo-400' },
                            { icon: <Sparkles size={14} />, label: 'Sites Online', value: stats.accessible, color: 'text-emerald-400' },
                            { icon: <Users size={14} />, label: 'Leads Capturados', value: stats.captured, color: 'text-cyan-400' },
                        ].map(({ icon, label, value, color }) => (
                            <div key={label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                                <span className={color}>{icon}</span>
                                <div>
                                    <p className="text-lg font-bold text-white leading-none">{value}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search Mode Toggles */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl w-fit mb-6 border border-slate-700/50">
                    <button
                        onClick={() => setSearchMode('simple')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            searchMode === 'simple' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Busca Simples
                    </button>
                    <button
                        onClick={() => setSearchMode('mass')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            searchMode === 'mass' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Busca em Massa
                    </button>
                </div>

                {/* Top section: Search Forms */}
                <div className="max-w-4xl mx-auto mb-8">
                    {searchMode === 'simple' ? (
                        <SearchForm
                            onSearch={handleSearch}
                            isLoading={isLoading}
                            recentSearches={recentSearches}
                        />
                    ) : (
                        <MassSearch
                            onResults={handleMassResults}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                        />
                    )}
                </div>

                {/* Results section */}
                <div className="fade-in">
                    {hasSearched && (
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <BarChart3 size={15} className="text-indigo-400" />
                                    {isLoading ? 'Buscando...' : `${searchResults.length} empresa${searchResults.length !== 1 ? 's' : ''} encontrada${searchResults.length !== 1 ? 's' : ''}`}
                                </h2>

                                {!isLoading && searchResults.length > 0 && (
                                    <button
                                        onClick={handleCaptureAll}
                                        disabled={isCapturingAll}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCapturingAll ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <PlusCircle size={13} />
                                        )}
                                        Capturar Todos
                                    </button>
                                )}
                            </div>

                            {!isLoading && searchResults.length > 0 && (
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-500">
                                        Página {page} de {totalPages}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {paginated.map((business) => (
                                    <BusinessCard
                                        key={business.place_id}
                                        business={business}
                                        onCapture={handleCapture}
                                        isCaptured={capturedLeads.has(business.place_id)}
                                    />
                                ))}
                            </div>
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        </>
                    ) : (
                        <EmptyState hasSearched={hasSearched} location={currentLocation} />
                    )}
                </div>
            </div>

            {/* Modals & Toasts */}
            {duplicateBusiness && (
                <DuplicateModal
                    business={duplicateBusiness}
                    onConfirm={handleDuplicateConfirm}
                    onCancel={() => setDuplicateBusiness(null)}
                />
            )}
            <ToastContainer toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </div>
    )
}
