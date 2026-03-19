import React, { useState, useEffect, useRef } from 'react'
import { 
    Search, Play, Pause, X, Check, ChevronsRight, ChevronDown, ChevronRight, 
    AlertCircle, Layers, Globe, Clock, CheckSquare, Square
} from 'lucide-react'
import { searchService } from '../services/search'
import type { Business } from '../types'
import { useMassSearchStore } from '../store/massSearchStore'

interface CategoryGroup {
    id: string
    label: string
    categories: string[]
}

const CATEGORY_GROUPS: CategoryGroup[] = [
    {
        id: 'auto',
        label: 'Automotivo',
        categories: [
            'Concessionária de Carros', 'Oficina Mecânica', 'Lava Jato', 
            'Loja de Pneus', 'Aluguel de Carros', 'Posto de Gasolina'
        ]
    },
    {
        id: 'food',
        label: 'Alimentação',
        categories: [
            'Restaurante', 'Cafeteria', 'Padaria', 'Pizzaria', 'Bar', 
            'Hamburgueria', 'Sorveteria', 'Supermercado'
        ]
    },
    {
        id: 'health',
        label: 'Saúde',
        categories: [
            'Clínica Médica', 'Dentista', 'Farmácia', 'Academia', 
            'Hospital', 'Laboratório', 'Veterinário', 'Psicólogo'
        ]
    },
    {
        id: 'professional',
        label: 'Serviços Profissionais',
        categories: [
            'Advogado', 'Contador', 'Imobiliária', 'Agência de Marketing', 
            'Arquitetura', 'Engenharia', 'TI e Software'
        ]
    },
    {
        id: 'retail',
        label: 'Varejo',
        categories: [
            'Loja de Roupas', 'Loja de Móveis', 'Eletrônicos', 'Pet Shop', 
            'Livraria', 'Joalheria', 'Floricultura'
        ]
    },
    {
        id: 'beauty',
        label: 'Beleza e Bem-Estar',
        categories: [
            'Salão de Beleza', 'Barbearia', 'Spa', 'Estética'
        ]
    },
    {
        id: 'education',
        label: 'Educação',
        categories: [
            'Escola', 'Faculdade', 'Curso de Idiomas', 'Escola de Música'
        ]
    },
    {
        id: 'home',
        label: 'Casa e Construção',
        categories: [
            'Loja de Material de Construção', 'Marcenaria', 'Pintura', 
            'Eletricista', 'Encanador', 'Decoração'
        ]
    }
]

interface MassSearchProps {
    onResults: (results: Business[], total: number, sessionId: string, isPartial?: boolean) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    location: string
}

export function MassSearch({ onResults, isLoading, setIsLoading, location }: MassSearchProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [expandedGroups, setExpandedGroups] = useState<string[]>(CATEGORY_GROUPS.map(g => g.id))
    const [useFreeScraper, setUseFreeScraper] = useState(true)
    
    // Resume/Pause State
    const [isPaused, setIsPaused] = useState(false)
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(-1)
    const [accumulatedResults, setAccumulatedResults] = useState<Business[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string>('')
    
    // Refs to avoid stale closures in loops
    const isPausedRef = useRef(false)
    const isRunningRef = useRef(false)
    const currentResultsRef = useRef<Business[]>([])
    const seenPlaceIdsRef = useRef<Set<string>>(new Set())

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const toggleGroup = (group: CategoryGroup) => {
        const allInGroup = group.categories.every(cat => selectedCategories.includes(cat))
        if (allInGroup) {
            setSelectedCategories(prev => prev.filter(cat => !group.categories.includes(cat)))
        } else {
            setSelectedCategories(prev => {
                const newCats = [...prev]
                group.categories.forEach(cat => {
                    if (!newCats.includes(cat)) newCats.push(cat)
                })
                return newCats
            })
        }
    }

    const selectAll = () => {
        const allCats = CATEGORY_GROUPS.flatMap(g => g.categories)
        setSelectedCategories(allCats)
    }

    const clearSelection = () => {
        setSelectedCategories([])
        setAccumulatedResults([])
        seenPlaceIdsRef.current = new Set()
    }

    const handleSearch = async () => {
        if (!location || selectedCategories.length === 0) return
        
        setIsLoading(true)
        setIsPaused(false)
        isPausedRef.current = false
        isRunningRef.current = true
        
        // Reset or initialize session
        const sessionId = currentSessionId || `mass-${Date.now()}`
        if (!currentSessionId) {
            setCurrentSessionId(sessionId)
            setAccumulatedResults([])
            currentResultsRef.current = []
            seenPlaceIdsRef.current = new Set()
        }

        const startIndex = currentCategoryIndex === -1 ? 0 : currentCategoryIndex
        
        try {
            for (let i = startIndex; i < selectedCategories.length; i++) {
                // Check if paused
                if (isPausedRef.current) {
                    setCurrentCategoryIndex(i)
                    isRunningRef.current = false
                    setIsLoading(false)
                    return
                }

                const cat = selectedCategories[i]
                setCurrentCategoryIndex(i)

                try {
                    const response = await searchService.searchBusinesses({
                        query: cat,
                        location,
                        radius: 5,
                        useFreeScraper
                    })

                    // De-duplicate results
                    const newUniqueResults: Business[] = []
                    response.results.forEach(item => {
                        if (!seenPlaceIdsRef.current.has(item.place_id)) {
                            seenPlaceIdsRef.current.add(item.place_id)
                            newUniqueResults.push(item)
                        }
                    })

                    if (newUniqueResults.length > 0) {
                        const updated = [...currentResultsRef.current, ...newUniqueResults]
                        currentResultsRef.current = updated
                        setAccumulatedResults(updated)
                        // Send partial results to parent
                        onResults(updated, updated.length, sessionId, true)
                    }
                } catch (err) {
                    console.error(`Error searching ${cat}:`, err)
                }
                
                // Small delay to prevent rate limit and allow state updates
                await new Promise(r => setTimeout(r, 500))
            }

            // Finished all categories
            setIsLoading(false)
            setCurrentCategoryIndex(-1)
            setCurrentSessionId('')
            isRunningRef.current = false
            onResults(currentResultsRef.current, currentResultsRef.current.length, sessionId, false)
            
        } catch (error) {
            console.error('Mass search error:', error)
            setIsLoading(false)
            isRunningRef.current = false
        }
    }

    const handlePause = () => {
        isPausedRef.current = true
        setIsPaused(true)
    }

    const handleCancel = () => {
        isRunningRef.current = false
        isPausedRef.current = false
        setIsPaused(false)
        setIsLoading(false)
        setCurrentCategoryIndex(-1)
        setCurrentSessionId('')
        setAccumulatedResults([])
        seenPlaceIdsRef.current = new Set()
    }

    const progress = selectedCategories.length > 0 
        ? Math.round(((currentCategoryIndex + 1) / selectedCategories.length) * 100) 
        : 0

    return (
        <div className="space-y-6">
            {/* Action Top Bar */}
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300">
                <div className="space-y-6">
                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => setUseFreeScraper(!useFreeScraper)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                    useFreeScraper 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                <Globe className="w-4 h-4" />
                                <span>Raspador Gratuito</span>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${useFreeScraper ? 'bg-blue-400' : 'bg-slate-400'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useFreeScraper ? 'right-0.5' : 'left-0.5'}`} />
                                </div>
                            </button>

                            {useFreeScraper && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg text-amber-700 dark:text-amber-400 text-xs animate-in slide-in-from-left-2 duration-300">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Busca gratuita é mais lenta (~2-3 min por categoria)</span>
                                </div>
                            )}
                        </div>

                        {!useFreeScraper && selectedCategories.length > 0 && (
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-indigo-500" />
                                <span>Previsão: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedCategories.length * 20}</span> créditos</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {!isLoading && !isPaused ? (
                            <button
                                onClick={handleSearch}
                                disabled={selectedCategories.length === 0 || !location}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:hover:scale-100 group"
                            >
                                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                Realizar Busca em Massa
                            </button>
                        ) : (
                            <>
                                {isLoading ? (
                                    <button
                                        onClick={handlePause}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                                    >
                                        <Pause className="w-5 h-5" />
                                        Pausar Tudo
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSearch}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                                    >
                                        <Play className="w-5 h-5" />
                                        Retomar
                                    </button>
                                )}
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title="Cancelar busca e limpar progresso"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        <div className="flex-1 flex gap-2">
                            <button
                                onClick={selectAll}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                Selecionar Tudo
                            </button>
                            <button
                                onClick={clearSelection}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {/* Progress Area */}
                    {(isLoading || isPaused || isRunningRef.current) && (
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    {isLoading ? (
                                        <div className="flex gap-1.5 h-4 items-center">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                                        </div>
                                    ) : (
                                        <Pause className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span className="font-medium">
                                        {isPaused ? 'Busca pausada' : `Processando: "${selectedCategories[currentCategoryIndex]}"`}
                                    </span>
                                </div>
                                <div className="font-mono text-xs flex gap-4">
                                    <span>{currentCategoryIndex + 1} de {selectedCategories.length} categorias</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{accumulatedResults.length} leads únicos</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-700 ease-out rounded-full ${isPaused ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.5)]'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CATEGORY_GROUPS.map(group => {
                    const isExpanded = expandedGroups.includes(group.id)
                    const groupSelectedCount = group.categories.filter(cat => selectedCategories.includes(cat)).length
                    const isAllSelected = groupSelectedCount === group.categories.length
                    const isPartial = groupSelectedCount > 0 && !isAllSelected

                    return (
                        <div key={group.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 group/card">
                            <div className="p-4 border-b border-slate-200/40 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleGroup(group)}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            isAllSelected ? 'bg-indigo-600 text-white' : 
                                            isPartial ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' : 
                                            'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        }`}
                                    >
                                        {isAllSelected ? <CheckSquare className="w-4 h-4" /> : 
                                         isPartial ? <Square className="w-4 h-4 opacity-50" /> :
                                         <Square className="w-4 h-4" />}
                                    </button>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                        {group.label}
                                        {groupSelectedCount > 0 && (
                                            <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
                                                {groupSelectedCount}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setExpandedGroups(prev => 
                                        prev.includes(group.id) ? prev.filter(id => id !== group.id) : [...prev, group.id]
                                    )}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            {isExpanded && (
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-300">
                                    {group.categories.map(cat => {
                                        const isSelected = selectedCategories.includes(cat)
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => toggleCategory(cat)}
                                                className={`flex items-center gap-2 p-2 rounded-xl text-xs sm:text-sm transition-all duration-200 text-left border ${
                                                    isSelected 
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium' 
                                                    : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                                <span className="truncate">{cat}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
