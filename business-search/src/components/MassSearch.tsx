import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, Sliders, Loader2, CheckSquare, Square, Layers, Zap, Turtle } from 'lucide-react'
import type { Business } from '../types'

interface MassSearchProps {
    onResults: (results: Business[], isPartial?: boolean) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    location: string
}

const CATEGORIES_GROUPS = [
    {
        name: 'Arquitetura e Construção',
        items: [
            { id: 'escritório de arquitetura', label: 'Arquitetura' },
            { id: 'designer de interiores', label: 'Design de Interiores' },
            { id: 'construtora', label: 'Construtora' },
            { id: 'engenheiro civil', label: 'Engenharia Civil' },
            { id: 'empresa de reformas', label: 'Reformas' },
            { id: 'paisagismo', label: 'Paisagismo' },
            { id: 'imobiliária', label: 'Imobiliária' },
            { id: 'incorporadora', label: 'Incorporadora' },
        ]
    },
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
            { id: 'insurance_agency', label: 'Seguradora' },
            { id: 'bank', label: 'Banco' },
            { id: 'atm', label: 'Caixa Eletrônico' },
            { id: 'farm', label: 'Fazenda' },
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

const SSE_BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3002/api'}/search/stream`

export default function MassSearch({ onResults, isLoading, setIsLoading, location }: MassSearchProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get('categories')?.split(',').filter(Boolean) || []
    )
    const [useFreeScraper, setUseFreeScraper] = useState(false)
    const [radius, setRadius] = useState(10)

    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [isPaused, setIsPaused] = useState(false)
    const [accumulatedResults, setAccumulatedResults] = useState<Business[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    const isRunningRef = useRef(false)
    const isPausedRef = useRef(false)
    const accumulatedRef = useRef<Business[]>([])
    const seenIdsRef = useRef(new Set<string>())
    const processedCatsRef = useRef(new Set<string>())
    const eventSourceRef = useRef<EventSource | null>(null)
    const hasAutoRunRef = useRef(false)

    // Cleanup on unmount
    useEffect(() => {
        return () => { eventSourceRef.current?.close() }
    }, [])

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const toggleAll = () => {
        setSelectedCategories(prev =>
            prev.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES]
        )
    }

    const toggleGroup = (groupIds: string[]) => {
        const allSelected = groupIds.every(id => selectedCategories.includes(id))
        setSelectedCategories(prev =>
            allSelected
                ? prev.filter(id => !groupIds.includes(id))
                : [...new Set([...prev, ...groupIds])]
        )
    }

    const startSSE = useCallback((categoriesToSearch: string[]) => {
        if (categoriesToSearch.length === 0) {
            setIsLoading(false)
            isRunningRef.current = false
            setProgress({ current: 0, total: 0 })
            onResults([...accumulatedRef.current], false)
            return
        }

        const params = new URLSearchParams({
            location,
            categories: categoriesToSearch.join(','),
            radius: String(radius),
            useFreeScraper: String(useFreeScraper),
        })

        const es = new EventSource(`${SSE_BASE}?${params}`)
        eventSourceRef.current = es

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === 'results' || data.type === 'error') {
                    processedCatsRef.current.add(data.category)
                    const done = processedCatsRef.current.size
                    setCurrentIndex(done)
                    setProgress({ current: done, total: selectedCategories.length })

                    if (data.type === 'results') {
                        ;(data.results as Business[]).forEach((res: Business) => {
                            if (!seenIdsRef.current.has(res.place_id)) {
                                seenIdsRef.current.add(res.place_id)
                                accumulatedRef.current.push(res)
                            }
                        })
                        setAccumulatedResults([...accumulatedRef.current])
                        onResults([...accumulatedRef.current], true)
                    }

                } else if (data.type === 'done') {
                    es.close()
                    eventSourceRef.current = null
                    setIsLoading(false)
                    isRunningRef.current = false
                    setProgress({ current: 0, total: 0 })
                    onResults([...accumulatedRef.current], false)
                }
            } catch (e) {
                console.error('SSE parse error:', e)
            }
        }

        es.onerror = () => {
            es.close()
            eventSourceRef.current = null
            setIsLoading(false)
            isRunningRef.current = false
            setProgress({ current: 0, total: 0 })
        }
    }, [location, radius, useFreeScraper, selectedCategories.length, onResults, setIsLoading])

    const handleSearch = useCallback((resume = false) => {
        if (!location.trim() || selectedCategories.length === 0) return

        setIsLoading(true)
        setIsPaused(false)
        isPausedRef.current = false
        isRunningRef.current = true

        if (!resume) {
            accumulatedRef.current = []
            seenIdsRef.current = new Set()
            processedCatsRef.current = new Set()
            setCurrentIndex(0)
            setAccumulatedResults([])
            setProgress({ current: 0, total: selectedCategories.length })
            onResults([], false)
        }

        const categoriesToSearch = resume
            ? selectedCategories.filter(c => !processedCatsRef.current.has(c))
            : selectedCategories

        startSSE(categoriesToSearch)
    }, [location, selectedCategories, onResults, setIsLoading, startSSE])

    const handlePause = () => {
        eventSourceRef.current?.close()
        eventSourceRef.current = null
        setIsPaused(true)
        isPausedRef.current = true
        setIsLoading(false)
    }

    const handleCancel = () => {
        eventSourceRef.current?.close()
        eventSourceRef.current = null
        setIsPaused(false)
        isPausedRef.current = false
        setIsLoading(false)
        isRunningRef.current = false
        setProgress({ current: 0, total: 0 })
        setCurrentIndex(0)
        accumulatedRef.current = []
        seenIdsRef.current = new Set()
        processedCatsRef.current = new Set()
        setAccumulatedResults([])
        onResults([], false)
    }

    // Auto-run from URL params
    useEffect(() => {
        if (
            !hasAutoRunRef.current &&
            searchParams.get('run') === '1' &&
            searchParams.get('mass') === 'true' &&
            location &&
            selectedCategories.length > 0
        ) {
            hasAutoRunRef.current = true
            handleSearch()
            const next = new URLSearchParams(searchParams)
            next.delete('run')
            setSearchParams(next, { replace: true })
        }
    }, [searchParams, location, selectedCategories, handleSearch, setSearchParams])

    const remaining = selectedCategories.length - currentIndex

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
                        <><CheckSquare size={14} /> Desmarcar Todos</>
                    ) : (
                        <><Square size={14} /> Selecionar Todos</>
                    )}
                </button>
            </div>

            {/* Radius slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Sliders size={12} /> Raio de busca
                    </label>
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {radius} km
                    </span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={100}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    style={{ '--value': `${((radius - 1) / 99) * 100}%` } as React.CSSProperties}
                    className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>1 km</span>
                    <span>100 km</span>
                </div>
            </div>

            {/* Free Scraper Toggle */}
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
                                ? 'Busca demorada (2 a 5 min), mas não gasta créditos.'
                                : 'Busca rápida via streaming. Consome créditos.'}
                        </p>
                    </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${useFreeScraper ? 'bg-amber-500' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${useFreeScraper ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
            </button>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
                <div className="p-1 px-2 bg-amber-500/20 rounded-lg text-amber-500 font-bold text-xs">!</div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-400">Aviso de Créditos</p>
                    <p className="text-[11px] text-slate-400">
                        Cada categoria selecionada ({selectedCategories.length}) realiza uma busca independente.
                        Os resultados chegam em tempo real conforme cada categoria é processada.
                    </p>
                </div>
            </div>

            {/* Action buttons */}
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
                        <Turtle size={18} className="animate-bounce" /> Pausar
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
                            <Zap size={18} /> Retomar ({remaining} restantes)
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleSearch(false)}
                        disabled={selectedCategories.length === 0 || !location.trim()}
                        className="flex-[2] py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading
                            ? <><Loader2 size={18} className="animate-spin" /> Buscando...</>
                            : <><Layers size={18} /> Iniciar Busca ({selectedCategories.length})</>
                        }
                    </button>
                )}
            </div>

            {/* Progress bar */}
            {(isLoading || isPaused) && (
                <div className="space-y-2 mb-2">
                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider">
                        <span className={isPaused ? 'text-amber-400' : 'text-indigo-400'}>
                            {isPaused ? 'Busca Pausada' : 'Processando via Streaming...'}
                        </span>
                        <span className="text-slate-500">{currentIndex} / {selectedCategories.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${isPaused ? 'bg-amber-500' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
                            style={{ width: `${selectedCategories.length > 0 ? (currentIndex / selectedCategories.length) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center italic">
                        {accumulatedResults.length} leads únicos encontrados até agora.
                    </p>
                </div>
            )}

            <div className="border-t border-slate-700/50 pt-6" />

            {/* Categories grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CATEGORIES_GROUPS.map((group) => {
                    const groupIds = group.items.map(i => i.id)
                    const allSelected = groupIds.every(id => selectedCategories.includes(id))

                    return (
                        <div key={group.name} className="space-y-3">
                            <div className="flex items-center justify-between pr-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 border-l-2 border-indigo-500/50">
                                    {group.name}
                                </h3>
                                <button
                                    onClick={() => toggleGroup(groupIds)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                                        allSelected
                                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {allSelected ? 'Desmarcar' : 'Selecionar'}
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
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
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
