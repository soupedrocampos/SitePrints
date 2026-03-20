import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, ChevronDown, Clock, X, Sliders, Loader2, CheckSquare, Square, Layers, Zap, Turtle } from 'lucide-react'
import { searchService } from '../services/search'
import type { Business } from '../types'

interface MassSearchProps {
    onResults: (results: Business[], categories: string[], isPartial?: boolean) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    externalLocation?: string
}

const CATEGORIES_GROUPS = [
    {
        name: 'Automotivo',
        items: [
            { id: 'car_dealer', label: 'Concessionária' },
            { id: 'car_rental', label: 'Aluguel de Carro' },
            { id: 'car_repair', label: 'Oficina Mecânica' },
            { id: 'car_wash', label: 'Lava Jato' },
            { id: 'electric_vehicle_charging_station', label: 'Recarga Veicular' },
            { id: 'gas_station', label: 'Posto de Gasolina' },
            { id: 'parking', label: 'Estacionamento' },
            { id: 'rest_stop', label: 'Parada de Descanso' }
        ]
    },
    {
        name: 'Negócios e Profissões',
        items: [
            { id: 'accounting', label: 'Contabilidade' },
            { id: 'corporate_office', label: 'Escritório Corporativo' },
            { id: 'consultant', label: 'Consultoria' },
            { id: 'lawyer', label: 'Advogado/Jurídico' },
            { id: 'real_estate_agency', label: 'Imobiliária' },
            { id: 'insurance_agency', label: 'Seguradora' },
            { id: 'bank', label: 'Banco' },
            { id: 'atm', label: 'Caixa Eletrônico' },
            { id: 'farm', label: 'Fazenda' },
            { id: 'ranch', label: 'Rancho' },
            { id: 'convention_center', label: 'Centro de Convenções' },
            { id: 'event_venue', label: 'Espaço para Eventos' }
        ]
    },
    {
        name: 'Cultura e Educação',
        items: [
            { id: 'art_gallery', label: 'Galeria de Arte' },
            { id: 'museum', label: 'Museu' },
            { id: 'performing_arts_theater', label: 'Teatro' },
            { id: 'library', label: 'Biblioteca' },
            { id: 'school', label: 'Escola' },
            { id: 'university', label: 'Universidade' },
            { id: 'preschool', label: 'Pré-escola' },
            { id: 'primary_school', label: 'Ensino Fundamental' },
            { id: 'secondary_school', label: 'Ensino Médio' }
        ]
    },
    {
        name: 'Lazer e Entretenimento',
        items: [
            { id: 'amusement_center', label: 'Centro de Diversão' },
            { id: 'amusement_park', label: 'Parque de Diversão' },
            { id: 'aquarium', label: 'Aquário' },
            { id: 'bowling_alley', label: 'Boliche' },
            { id: 'casino', label: 'Cassino' },
            { id: 'comedy_club', label: 'Clube de Comédia' },
            { id: 'movie_theater', label: 'Cinema' },
            { id: 'night_club', label: 'Balada/Boate' },
            { id: 'zoo', label: 'Zoológico' },
            { id: 'water_park', label: 'Parque Aquático' },
            { id: 'wedding_venue', label: 'Espaço de Casamento' }
        ]
    },
    {
        name: 'Alimentação (Restaurantes)',
        items: [
            { id: 'brazilian_restaurant', label: 'Brasileiro' },
            { id: 'italian_restaurant', label: 'Italiano' },
            { id: 'japanese_restaurant', label: 'Japonês' },
            { id: 'chinese_restaurant', label: 'Chinês' },
            { id: 'mexican_restaurant', label: 'Mexicano' },
            { id: 'french_restaurant', label: 'Francês' },
            { id: 'seafood_restaurant', label: 'Frutos do Mar' },
            { id: 'steak_house', label: 'Churrascaria' },
            { id: 'pizza_restaurant', label: 'Pizzaria' },
            { id: 'hamburger_restaurant', label: 'Hamburgueria' },
            { id: 'sushi_restaurant', label: 'Sushi' },
            { id: 'ramen_restaurant', label: 'Ramen' },
            { id: 'mediterranean_restaurant', label: 'Mediterrâneo' },
            { id: 'middle_eastern_restaurant', label: 'Árabe' },
            { id: 'thai_restaurant', label: 'Tailandês' },
            { id: 'vegan_restaurant', label: 'Vegano' },
            { id: 'vegetarian_restaurant', label: 'Vegetariano' }
        ]
    },
    {
        name: 'Alimentação (Cafés e Outros)',
        items: [
            { id: 'bakery', label: 'Padaria' },
            { id: 'cafe', label: 'Café' },
            { id: 'coffee_shop', label: 'Cafeteria' },
            { id: 'bar', label: 'Bar' },
            { id: 'pub', label: 'Pub' },
            { id: 'wine_bar', label: 'Wine Bar' },
            { id: 'donut_shop', label: 'Donuts' },
            { id: 'ice_cream_shop', label: 'Sorveteria' },
            { id: 'candy_store', label: 'Doceira' },
            { id: 'juice_shop', label: 'Casa de Sucos' },
            { id: 'acai_shop', label: 'Açaí' }
        ]
    },
    {
        name: 'Saúde e Bem-estar',
        items: [
            { id: 'dentist', label: 'Dentista' },
            { id: 'doctor', label: 'Médico' },
            { id: 'hospital', label: 'Hospital' },
            { id: 'pharmacy', label: 'Farmácia' },
            { id: 'chiropractor', label: 'Quiroprata' },
            { id: 'physiotherapist', label: 'Fisioterapeuta' },
            { id: 'spa', label: 'Spa' },
            { id: 'wellness_center', label: 'Bem-estar' },
            { id: 'yoga_studio', label: 'Yoga' },
            { id: 'skin_care_clinic', label: 'Clínica de Estética' }
        ]
    },
    {
        name: 'Serviços Pessoais',
        items: [
            { id: 'beauty_salon', label: 'Salão de Beleza' },
            { id: 'barber_shop', label: 'Barbearia' },
            { id: 'hair_care', label: 'Cabelereiro' },
            { id: 'nail_salon', label: 'Manicure/Nail Salon' },
            { id: 'laundry', label: 'Lavanderia' },
            { id: 'veterinary_care', label: 'Veterinário' },
            { id: 'pet_store', label: 'Pet Shop' },
            { id: 'child_care', label: 'Creche/Cuidado Infantil' },
            { id: 'florist', label: 'Floricultura' },
            { id: 'tailor', label: 'Costureiro' },
            { id: 'locksmith', label: 'Chaveiro' },
            { id: 'moving_company', label: 'Mudanças' },
            { id: 'plumber', label: 'Encanador' },
            { id: 'electrician', label: 'Eletricista' },
            { id: 'painter', label: 'Pintor' },
            { id: 'roofing_contractor', label: 'Telhadista/Calheiro' },
            { id: 'storage', label: 'Depósito/Self Storage' }
        ]
    },
    {
        name: 'Compras',
        items: [
            { id: 'shopping_mall', label: 'Shopping' },
            { id: 'supermarket', label: 'Supermercado' },
            { id: 'grocery_store', label: 'Mercado/Mercearia' },
            { id: 'butcher_shop', label: 'Açougue' },
            { id: 'liquor_store', label: 'Adega/Bebidas' },
            { id: 'clothing_store', label: 'Loja de Roupas' },
            { id: 'shoe_store', label: 'Sapataria' },
            { id: 'jewelry_store', label: 'Joalheria' },
            { id: 'electronics_store', label: 'Eletrônicos' },
            { id: 'cell_phone_store', label: 'Loja de Celular' },
            { id: 'furniture_store', label: 'Móveis' },
            { id: 'home_goods_store', label: 'Artigos para Casa' },
            { id: 'hardware_store', label: 'Ferragens' },
            { id: 'home_improvement_store', label: 'Material de Construção' },
            { id: 'bicycle_store', label: 'Loja de Bicicleta' },
            { id: 'book_store', label: 'Livraria' },
            { id: 'gift_shop', label: 'Loja de Presentes' },
            { id: 'sporting_goods_store', label: 'Artigos Esportivos' }
        ]
    },
    {
        name: 'Hospedagem',
        items: [
            { id: 'hotel', label: 'Hotel' },
            { id: 'motel', label: 'Motel' },
            { id: 'resort_hotel', label: 'Resort' },
            { id: 'guest_house', label: 'Pousada' },
            { id: 'bed_and_breakfast', label: 'B&B' },
            { id: 'hostel', label: 'Albergue/Hostel' }
        ]
    },
    {
        name: 'Governo e Utilidades',
        items: [
            { id: 'city_hall', label: 'Prefeitura' },
            { id: 'courthouse', label: 'Fórum' },
            { id: 'embassy', label: 'Embaixada' },
            { id: 'fire_station', label: 'Bombeiros' },
            { id: 'police', label: 'Polícia' },
            { id: 'post_office', label: 'Correios' }
        ]
    },
    {
        name: 'Viagem e Transp.',
        items: [
            { id: 'airport', label: 'Aeroporto' },
            { id: 'bus_station', label: 'Rodoviária' },
            { id: 'train_station', label: 'Estação de Trem' },
            { id: 'subway_station', label: 'Metrô' },
            { id: 'taxi_stand', label: 'Ponto de Táxi' },
            { id: 'travel_agency', label: 'Agência de Viagem' }
        ]
    }
]

const ALL_CATEGORIES = [...new Set(CATEGORIES_GROUPS.flatMap(g => g.items.map(i => i.id)))]

/* ─── CEP regex ─────── */
const CEP_RE = /^\d{5}-?\d{3}$/

/* ─── ViaCEP response ── */
interface ViaCEPResponse {
    localidade: string
    uf: string
    erro?: boolean
}

/* ─── Suggestion item ── */
interface Suggestion {
    label: string
    sublabel?: string
}

const CITIES: Suggestion[] = [
    { label: 'São Paulo', sublabel: 'SP' },
    { label: 'Rio de Janeiro', sublabel: 'RJ' },
    { label: 'Belo Horizonte', sublabel: 'MG' },
    { label: 'Curitiba', sublabel: 'PR' },
    { label: 'Porto Alegre', sublabel: 'RS' },
    { label: 'Salvador', sublabel: 'BA' },
    { label: 'Fortaleza', sublabel: 'CE' },
    { label: 'Recife', sublabel: 'PE' },
    { label: 'Barueri', sublabel: 'SP' },
    { label: 'Osasco', sublabel: 'SP' },
    { label: 'Guarulhos', sublabel: 'SP' },
]

export default function MassSearch({ onResults, isLoading, setIsLoading, externalLocation = '' }: MassSearchProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get('categories')?.split(',').filter(Boolean) || []
    )
    const [useFreeScraper, setUseFreeScraper] = useState(false)
    
    // Search control state
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [isPaused, setIsPaused] = useState(false)
    const [accumulatedResults, setAccumulatedResults] = useState<Business[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    const isRunningRef = useRef(false)
    const isPausedRef = useRef(false)
    const accumulatedRef = useRef<Business[]>([])
    const seenIdsRef = useRef(new Set<string>())
    const hasAutoRunRef = useRef(false)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const toggleAll = () => {
        if (selectedCategories.length === ALL_CATEGORIES.length) {
            setSelectedCategories([])
        } else {
            setSelectedCategories([...ALL_CATEGORIES])
        }
    }

    const toggleGroup = (groupIdIds: string[]) => {
        const allInGroupSelected = groupIdIds.every(id => selectedCategories.includes(id))
        if (allInGroupSelected) {
            setSelectedCategories(prev => prev.filter(id => !groupIdIds.includes(id)))
        } else {
            const newSelection = new Set([...selectedCategories, ...groupIdIds])
            setSelectedCategories(Array.from(newSelection))
        }
    }

    const handleSearch = useCallback(async (resume = false) => {
        if (!externalLocation.trim() || selectedCategories.length === 0) return
        
        setIsLoading(true)
        setIsPaused(false)
        isPausedRef.current = false
        isRunningRef.current = true

        const startIdx = resume ? currentIndex : 0
        if (!resume) {
            accumulatedRef.current = []
            seenIdsRef.current = new Set()
            setCurrentIndex(0)
            setProgress({ current: 0, total: selectedCategories.length })
        }

        try {
            for (let i = startIdx; i < selectedCategories.length; i++) {
                if (isPausedRef.current) break

                const category = selectedCategories[i]
                setCurrentIndex(i)
                setProgress({ current: i, total: selectedCategories.length })

                try {
                    const data = await searchService.searchBusinesses({
                        query: category,
                        location: externalLocation,
                        useFreeScraper,
                        radius: 5
                    })

                    data.results.forEach(res => {
                        if (!seenIdsRef.current.has(res.place_id)) {
                            seenIdsRef.current.add(res.place_id)
                            accumulatedRef.current.push(res)
                        }
                    })
                    
                    // Update state for UI visibility but keep ref for logic
                    setAccumulatedResults([...accumulatedRef.current])
                    
                    // Send partial results to SearchPage
                    onResults(accumulatedRef.current, selectedCategories, true)
                } catch (err) {
                    console.error(`Error searching category ${category}:`, err)
                }
            }

            if (!isPausedRef.current) {
                onResults(accumulatedRef.current, selectedCategories, false)
                setIsLoading(false)
                isRunningRef.current = false
                setProgress({ current: 0, total: 0 })
            }
        } catch (error) {
            console.error('Mass search failed:', error)
            setIsLoading(false)
            isRunningRef.current = false
        }
    }, [externalLocation, selectedCategories, useFreeScraper, onResults, setIsLoading])

    const handlePause = () => {
        setIsPaused(true)
        isPausedRef.current = true
        setIsLoading(false)
    }

    const handleCancel = () => {
        setIsPaused(false)
        isPausedRef.current = false
        setIsLoading(false)
        isRunningRef.current = false
        setProgress({ current: 0, total: 0 })
        setCurrentIndex(0)
        accumulatedRef.current = []
        seenIdsRef.current = new Set()
        setAccumulatedResults([])
    }

    useEffect(() => {
        if (
            !hasAutoRunRef.current &&
            searchParams.get('run') === '1' &&
            searchParams.get('mass') === 'true' &&
            externalLocation &&
            selectedCategories.length > 0
        ) {
            hasAutoRunRef.current = true
            handleSearch()
            const next = new URLSearchParams(searchParams)
            next.delete('run')
            setSearchParams(next, { replace: true })
        }
    }, [searchParams, externalLocation, selectedCategories, handleSearch, setSearchParams])

    return (
        <div className="glass rounded-2xl p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <Layers size={18} className="text-indigo-400" />
                        Busca em Massa
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione múltiplas categorias para uma busca completa</p>
                </div>
                
                <button 
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                >
                    {selectedCategories.length === ALL_CATEGORIES.length ? (
                        <>
                            <CheckSquare size={14} />
                            Desmarcar Todos
                        </>
                    ) : (
                        <>
                            <Square size={14} />
                            Selecionar Todos
                        </>
                    )}
                </button>
            </div>

            {/* Free Scraper Toggle (Moved Up) */}
            <button
                type="button"
                aria-pressed={useFreeScraper}
                aria-label="Usar raspador gratuito"
                className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors text-left"
                onClick={() => setUseFreeScraper(!useFreeScraper)}
            >
                <div className="flex gap-3 items-center">
                    <div className={`p-2.5 rounded-lg transition-colors ${useFreeScraper ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {useFreeScraper ? <Turtle size={18} /> : <Zap size={18} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">Usar Raspador Gratuito (Econômico)</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {useFreeScraper 
                                ? "Busca demorada (2 a 5 minutos), mas não gasta créditos." 
                                : "Busca rápida usando a API oficial. Consome créditos."}
                        </p>
                    </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${useFreeScraper ? 'bg-amber-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${useFreeScraper ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
            </button>

            {/* Warning Info */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
                <div className="p-1 px-2 bg-amber-500/20 rounded-lg text-amber-500 font-bold text-xs">!</div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-400">Aviso de Créditos</p>
                    <p className="text-[11px] text-slate-400">
                        Cada categoria selecionada ({selectedCategories.length}) realizará uma busca independente. 
                        Isso consumirá créditos da API proporcionalmente ao número de categorias.
                    </p>
                </div>
            </div>

            {/* Action Area: Clear & Run */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => setSelectedCategories([])}
                    className="flex-1 py-3 px-6 rounded-xl border border-slate-700 text-slate-400 font-medium text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <X size={16} /> Limpar Seleção
                </button>

                {isLoading ? (
                    <button
                        onClick={handlePause}
                        className="flex-1 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Turtle size={18} className="animate-bounce" /> Pausar Tudo
                    </button>
                ) : isPaused ? (
                    <div className="flex-[2] flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="flex-1 py-3 px-4 rounded-xl border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                        >
                             Cancelar
                        </button>
                        <button
                            onClick={() => handleSearch(true)}
                            className="flex-[2] py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={18} /> Retomar ({selectedCategories.length - currentIndex} restantes)
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleSearch(false)}
                        disabled={selectedCategories.length === 0 || !externalLocation.trim()}
                        className="flex-[2] py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Layers size={18} /> Iniciar Busca ({selectedCategories.length})
                    </button>
                )}
            </div>

            {/* Progress Bar (Visual Only while running or paused) */}
            {(isLoading || isPaused) && (
                <div className="mt-2 space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider">
                        <span className={isPaused ? "text-amber-400" : "text-indigo-400"}>
                            {isPaused ? "Busca Pausada" : "Processando Categorias..."}
                        </span>
                        <span className="text-slate-500">{currentIndex + 1} / {selectedCategories.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${isPaused ? "bg-amber-500" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"}`}
                            style={{ width: `${((currentIndex + 1) / selectedCategories.length) * 100}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center italic">
                        {accumulatedResults.length} leads únicos encontrados até agora.
                    </p>
                </div>
            )}

            <div className="border-t border-slate-700/50 pt-6"></div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CATEGORIES_GROUPS.map((group) => {
                    const groupIds = group.items.map(i => i.id)
                    const allInGroupSelected = groupIds.every(id => selectedCategories.includes(id))
                    
                    return (
                        <div key={group.name} className="space-y-3">
                            <div className="flex items-center justify-between pr-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 border-l-2 border-indigo-500/50">
                                    {group.name}
                                </h3>
                                <button 
                                    onClick={() => toggleGroup(groupIds)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                                        allInGroupSelected 
                                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {allInGroupSelected ? 'Desmarcar' : 'Selecionar'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                            {group.items.map((cat) => {
                                const active = selectedCategories.includes(cat.id)
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all text-left ${
                                            active
                                                ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                            active ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                                        }`}>
                                            {active && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                )
                            })}
                            </div>
                        </div>
                    )
                })}
            </div>


        </div>
    )
}
