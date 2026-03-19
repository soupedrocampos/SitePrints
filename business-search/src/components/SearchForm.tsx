import React, { useState, useEffect } from 'react'
import { 
    Search, MapPin, Target, 
    ArrowRight, Sparkles, Globe, 
    Clock, AlertCircle 
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

interface SearchFormProps {
    onSearch: (query: string, location: string, radius: number, useFreeScraper: boolean) => void
    isLoading: boolean
    location: string
}

export function SearchForm({ onSearch, isLoading, location }: SearchFormProps) {
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [radius, setRadius] = useState(5)
    const [useFreeScraper, setUseFreeScraper] = useState(true)

    // Pre-fill from URL params (e.g. from history repeat)
    useEffect(() => {
        const q = searchParams.get('q')
        const r = searchParams.get('r')
        if (q) setQuery(q)
        if (r) setRadius(Number(r))
    }, [searchParams])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query && location) {
            onSearch(query, location, radius, useFreeScraper)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 group-focus-within:text-blue-500 group-focus-within:bg-blue-50 dark:group-focus-within:bg-blue-900/40 transition-all">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Ex: Restaurantes de Luxo, Dentistas, Concessionárias..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-18 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radius Slider */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                <Target className="w-4 h-4 text-indigo-500" />
                                Raio: <span className="text-slate-900 dark:text-white ml-1">{radius}km</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                        />
                    </div>

                    {/* Free Scraper Toggle */}
                    <div 
                        onClick={() => setUseFreeScraper(!useFreeScraper)}
                        className={`p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                            useFreeScraper 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/5' 
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${useFreeScraper ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                <Globe className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <span className={`text-sm font-black uppercase tracking-widest block ${useFreeScraper ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>Raspador Gratuito</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Sem custos de API</span>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${useFreeScraper ? 'bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useFreeScraper ? 'right-1' : 'left-1'}`} />
                        </div>
                    </div>
                </div>

                {useFreeScraper && (
                    <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl text-amber-700 dark:text-amber-400 text-sm font-bold animate-in slide-in-from-top-2">
                        <Clock className="w-5 h-5" />
                        <span>A busca gratuita pode levar até 2-3 minutos devido à automação do navegador.</span>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading || !query || !location}
                className="w-full flex items-center justify-center gap-4 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 group overflow-hidden relative"
            >
                {isLoading ? (
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Buscando Leads...</span>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10">Explorar Estabelecimentos</span>
                        <ArrowRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2" />
                    </>
                )}
            </button>
        </form>
    )
}
