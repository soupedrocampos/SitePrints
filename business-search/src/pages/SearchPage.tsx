import { useState } from 'react'
import SearchForm from '../components/SearchForm'
import { BusinessCard } from '../components/BusinessCard'
import { searchService } from '../services/search'
import { leadsService } from '../services/leads'
import type { Business } from '../types'
import type { BusinessType } from '../types/business'
import { Users, Database, Search as SearchIcon, Layers } from 'lucide-react'
import MassSearch from '../components/MassSearch'
import { LocationInput } from '../components/LocationInput'
import { saveSearchToHistory } from '../services/searchHistory'

export function SearchPage() {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchMode, setSearchMode] = useState<'simple' | 'mass'>('simple')
    const [location, setLocation] = useState('')
    const [lastSessionId, setLastSessionId] = useState('')
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('recentSearches') || '[]') } catch { return [] }
    })

    const handleSearch = async (
        query: string,
        searchLocation: string,
        radius: number,
        _types: BusinessType[],
        useFreeScraper = false
    ) => {
        setIsLoading(true)
        try {
            const response = await searchService.searchBusinesses({
                query,
                location: searchLocation,
                radius,
                useFreeScraper,
            })
            setBusinesses(response.results)
            setLastSessionId(response.sessionId)

            saveSearchToHistory({
                query,
                location: searchLocation,
                radius,
                resultsCount: response.results.length,
                sessionId: response.sessionId,
                types: [],
            })

            const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
            setRecentSearches(updated)
            localStorage.setItem('recentSearches', JSON.stringify(updated))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleMassResults = (results: Business[], _isPartial = false) => {
        setBusinesses(results)
    }

    const handleImportAll = async () => {
        if (!businesses.length) return
        let count = 0
        for (const biz of businesses) {
            try {
                await leadsService.createLead({
                    companyName: biz.name,
                    cnpj: 'Pendente',
                    website: biz.website || undefined,
                    phone: biz.phone || undefined,
                    address: biz.address,
                    city: biz.city || '',
                    state: biz.state || '',
                    source: 'Google Maps' as any,
                    sessionId: lastSessionId,
                })
                count++
            } catch (err) {
                console.error('Error importing:', err)
            }
        }
        alert(`${count} estabelecimentos importados como novos leads!`)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 border border-slate-200/50 dark:border-slate-800/10 rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 space-y-4 md:space-y-0 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                        <button
                            onClick={() => setSearchMode('simple')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                searchMode === 'simple'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <SearchIcon className="w-4 h-4" /> Busca Simples
                        </button>
                        <button
                            onClick={() => setSearchMode('mass')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                searchMode === 'mass'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-4 h-4" /> Busca em Massa
                        </button>
                    </div>

                    <div className="w-full md:w-96 order-first md:order-none">
                        <LocationInput onLocationChange={setLocation} initialValue={location} />
                    </div>

                    <div className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-3">
                        <Database className="w-4 h-4" />
                        {businesses.length} Resultados
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
                    {searchMode === 'simple' ? (
                        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-2 duration-500">
                            <SearchForm
                                onSearch={handleSearch}
                                isLoading={isLoading}
                                recentSearches={recentSearches}
                                externalLocation={location}
                            />
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <MassSearch
                                onResults={handleMassResults}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                                location={location}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Results Header */}
            {businesses.length > 0 && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Resultados{location ? ` em ${location}` : ''}
                    </h2>
                    <button
                        onClick={handleImportAll}
                        className="flex items-center gap-2.5 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95"
                    >
                        <Users className="w-4 h-4" />
                        Capturar {businesses.length} Leads
                    </button>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {businesses.map((biz) => (
                    <BusinessCard key={biz.place_id} business={biz} sessionId={lastSessionId} />
                ))}
            </div>

            {businesses.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-full shadow-2xl shadow-indigo-500/10 animate-bounce">
                        <SearchIcon className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Pronto para começar?</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                            Digite a localização no campo acima, selecione as categorias e inicie a busca.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
