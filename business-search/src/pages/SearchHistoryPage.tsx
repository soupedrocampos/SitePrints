import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    History, Search, MapPin, Calendar, 
    ArrowRight, Trash2, Download, Filter,
    Layers, Zap, Clock, ChevronRight,
    Search as SearchIcon, Database,
    User, MousePointer2, ExternalLink
} from 'lucide-react'
import { searchService, type SearchHistoryItem } from '../services/search'
import { formatLocationWithFlag } from '../utils/flags'

export function SearchHistoryPage() {
    const navigate = useNavigate()
    const [history, setHistory] = useState<SearchHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        setIsLoading(true)
        try {
            const data = await searchService.getHistory()
            setHistory(data.data)
        } catch (error) {
            console.error('History load error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const deleteItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Deseja excluir este item do histórico?')) {
            await searchService.deleteHistoryItem(id)
            loadHistory()
        }
    }

    const handleRepeat = (item: SearchHistoryItem) => {
        // Encode state into URL to auto-fill on SearchPage
        const params = new URLSearchParams()
        params.set('q', item.query)
        params.set('loc', item.location)
        params.set('r', item.radius.toString())
        if (item.types && item.types.length > 0) {
            params.set('types', item.types.join(','))
        }
        navigate(`/?${params.toString()}`)
    }

    const filteredHistory = history.filter(item => 
        item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-200/10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-600/10 rounded-2xl">
                             <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Histórico de Busca</h1>
                             <p className="text-slate-500 font-semibold mt-1">Revise e repita suas prospecções anteriores</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar no histórico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <button 
                        onClick={() => searchService.clearHistory().then(loadHistory)}
                        className="w-full sm:w-auto px-6 py-4 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all font-bold flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        Limpar Tudo
                    </button>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
                        ))}
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredHistory.map((item) => (
                            <div 
                                key={item.id}
                                className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 border-l-4 border-l-transparent hover:border-l-indigo-600"
                            >
                                <div className="space-y-5">
                                    {/* Item Type & Date */}
                                    <div className="flex items-center justify-between">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                            item.types && item.types.length > 0 
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                            {item.types && item.types.length > 0 ? <Layers className="w-3 h-3" /> : <SearchIcon className="w-3 h-3" />}
                                            {item.types && item.types.length > 0 ? 'Busca em Massa' : 'Busca Simples'}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                                            {item.query}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                                            <MapPin className="w-4 h-4 text-indigo-500" />
                                            {formatLocationWithFlag(item.location)}
                                        </div>
                                    </div>

                                    {/* Params Display */}
                                    {item.types && item.types.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {item.types.slice(0, 3).map((t, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold">
                                                    {t}
                                                </span>
                                            ))}
                                            {item.types.length > 3 && (
                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold">
                                                    +{item.types.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-0.5">
                                            <div className="text-lg font-black text-slate-900 dark:text-white">{item.resultsCount}</div>
                                            <div className="text-[10px] font-black uppercase tracking-tight text-slate-400">Resultados</div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{item.leadsCount}</div>
                                            <div className="text-[10px] font-black uppercase tracking-tight text-slate-400">Leads</div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex items-center gap-2 pt-4">
                                        <button 
                                            onClick={() => handleRepeat(item)}
                                            className="flex-1 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all hover:bg-indigo-600 dark:hover:bg-white hover:scale-[1.02] shadow-xl shadow-slate-900/10 active:scale-95"
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                            Repetir
                                        </button>
                                        
                                        <button 
                                            onClick={() => navigate(`/leads?search=${item.sessionId}`)}
                                            className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                                            title="Ver Leads desta Sessão"
                                        >
                                            <MousePointer2 className="w-5 h-5" />
                                        </button>

                                        <button 
                                            onClick={(e) => deleteItem(item.id, e)}
                                            className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 px-6 text-center space-y-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="p-12 bg-white dark:bg-slate-900 rounded-full shadow-2xl shadow-indigo-500/10 animate-bounce">
                             <Clock className="w-16 h-16 text-indigo-500/20" />
                        </div>
                        <div className="space-y-2">
                             <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Sem histórico por enquanto</h2>
                             <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-lg">Suas futuras prospecções aparecerão aqui para serem repetidas ou baixadas.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
                        >
                            <Plus className="w-6 h-6" />
                            Nova Busca
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
