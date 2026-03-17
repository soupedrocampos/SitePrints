import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, ChevronDown, Clock, X, Sliders, Loader2, CheckSquare, Square, Layers } from 'lucide-react'
import { searchService } from '../services/search'
import type { Business } from '../types'

interface MassSearchProps {
    onResults: (results: Business[]) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
}

const CATEGORIES_GROUPS = [
    {
        name: 'Automotivo & Transp.',
        items: [
            { id: 'car_dealer', label: 'Concessionária' },
            { id: 'car_rental', label: 'Aluguel de Carro' },
            { id: 'car_repair', label: 'Oficina Mecânica' },
            { id: 'car_wash', label: 'Lava Jato' },
            { id: 'gas_station', label: 'Posto de Gasolina' },
            { id: 'parking', label: 'Estacionamento' },
            { id: 'airport', label: 'Aeroporto' },
            { id: 'bus_station', label: 'Rodoviária' },
            { id: 'train_station', label: 'Estação de Trem' }
        ]
    },
    {
        name: 'Saúde & Bem-estar',
        items: [
            { id: 'dentist', label: 'Dentista' },
            { id: 'doctor', label: 'Médico/Clínica' },
            { id: 'hospital', label: 'Hospital' },
            { id: 'pharmacy', label: 'Farmácia' },
            { id: 'physiotherapist', label: 'Fisioterapeuta' },
            { id: 'gym', label: 'Academia' },
            { id: 'spa', label: 'Spa' },
            { id: 'yoga_studio', label: 'Yoga' }
        ]
    },
    {
        name: 'Alimentação',
        items: [
            { id: 'bakery', label: 'Padaria' },
            { id: 'bar', label: 'Bar' },
            { id: 'cafe', label: 'Café' },
            { id: 'restaurant', label: 'Restaurante' },
            { id: 'pizza_restaurant', label: 'Pizzaria' },
            { id: 'hamburger_restaurant', label: 'Hamburgueria' },
            { id: 'ice_cream_shop', label: 'Sorveteria' },
            { id: 'steak_house', label: 'Churrascaria' },
            { id: 'sushi_restaurant', label: 'Japonês' }
        ]
    },
    {
        name: 'Serviços Profissionais',
        items: [
            { id: 'accounting', label: 'Contabilidade' },
            { id: 'bank', label: 'Banco' },
            { id: 'lawyer', label: 'Advogado' },
            { id: 'real_estate_agency', label: 'Imobiliária' },
            { id: 'insurance_agency', label: 'Seguradora' },
            { id: 'consultant', label: 'Consultoria' },
            { id: 'locksmith', label: 'Chaveiro' },
            { id: 'moving_company', label: 'Mudanças' }
        ]
    },
    {
        name: 'Serviços Pessoais',
        items: [
            { id: 'beauty_salon', label: 'Salão de Beleza' },
            { id: 'barber_shop', label: 'Barbearia' },
            { id: 'hair_care', label: 'Cabelereiro' },
            { id: 'laundry', label: 'Lavanderia' },
            { id: 'veterinary_care', label: 'Veterinário' },
            { id: 'pet_store', label: 'Pet Shop' },
            { id: 'child_care', label: 'Creche' }
        ]
    },
    {
        name: 'Compras',
        items: [
            { id: 'clothing_store', label: 'Loja de Roupas' },
            { id: 'electronics_store', label: 'Eletrônicos' },
            { id: 'furniture_store', label: 'Móveis' },
            { id: 'grocery_store', label: 'Mercado' },
            { id: 'supermarket', label: 'Supermercado' },
            { id: 'shopping_mall', label: 'Shopping' },
            { id: 'jewelry_store', label: 'Joalheria' },
            { id: 'pet_store', label: 'Pet Shop' }
        ]
    },
    {
        name: 'Educação & Cultura',
        items: [
            { id: 'school', label: 'Escola' },
            { id: 'university', label: 'Universidade' },
            { id: 'library', label: 'Biblioteca' },
            { id: 'art_gallery', label: 'Galeria de Arte' },
            { id: 'museum', label: 'Museu' }
        ]
    },
    {
        name: 'Hospedagem',
        items: [
            { id: 'hotel', label: 'Hotel' },
            { id: 'motel', label: 'Motel' },
            { id: 'resort_hotel', label: 'Resort' },
            { id: 'guest_house', label: 'Pousada' }
        ]
    }
]

const ALL_CATEGORIES = CATEGORIES_GROUPS.flatMap(g => g.items.map(i => i.id))

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

export default function MassSearch({ onResults, isLoading, setIsLoading }: MassSearchProps) {
    const [location, setLocation] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    
    // Location autocomplete state
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState('')
    
    // Progress state
    const [progress, setProgress] = useState({ current: 0, total: 0 })

    const locationRef = useRef<HTMLDivElement>(null)
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

    const handleSearch = async () => {
        if (!location.trim() || selectedCategories.length === 0) return
        
        setIsLoading(true)
        setProgress({ current: 0, total: 1 }) // Just indicating start
        
        try {
            const data = await searchService.massSearch(location, selectedCategories)
            onResults(data.results)
        } catch (error) {
            console.error('Mass search failed:', error)
        } finally {
            setIsLoading(false)
            setProgress({ current: 0, total: 0 })
        }
    }

    /* ─── CEP lookup via ViaCEP ─────────────────────────── */
    const lookupCEP = useCallback(async (cep: string) => {
        setLocationLoading(true)
        setLocationError('')
        try {
            const clean = cep.replace(/\D/g, '')
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
            const data: ViaCEPResponse = await res.json()
            if (data.erro) {
                setLocationError('CEP não encontrado')
                setSuggestions([])
            } else {
                const city = `${data.localidade}, ${data.uf}`
                setLocation(city)
                setSuggestions([])
                setShowSuggestions(false)
                setLocationError('')
            }
        } catch {
            setLocationError('Erro ao buscar CEP')
        } finally {
            setLocationLoading(false)
        }
    }, [])

    /* ─── Location input change handler ─────────────────── */
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setLocation(val)
        setLocationError('')

        if (debounceRef.current) clearTimeout(debounceRef.current)

        const raw = val.replace(/\D/g, '')

        if (raw.length >= 8 && /^\d+$/.test(raw)) {
            const formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`
            if (CEP_RE.test(formatted) || raw.length === 8) {
                debounceRef.current = setTimeout(() => lookupCEP(raw), 600)
                setSuggestions([])
                setShowSuggestions(false)
                return
            }
        }

        if (val.trim().length >= 2) {
            const lower = val.toLowerCase()
            const filtered = CITIES.filter(
                (c) =>
                    c.label.toLowerCase().includes(lower) ||
                    (c.sublabel && c.sublabel.toLowerCase().includes(lower))
            ).slice(0, 7)
            setSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const pickSuggestion = (s: Suggestion) => {
        const full = s.sublabel ? `${s.label}, ${s.sublabel}` : s.label
        setLocation(full)
        setSuggestions([])
        setShowSuggestions(false)
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

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

            {/* Location & Action */}
            <div className="pt-4 border-t border-slate-700/50 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full" ref={locationRef}>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                        Localização para Busca em Massa
                    </label>
                    <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={location}
                            onChange={handleLocationChange}
                            placeholder="Ex: São Paulo, SP ou 01310-100"
                            className={`w-full bg-slate-800/60 border rounded-xl pl-9 pr-9 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                                locationError ? 'border-red-500/70' : 'border-slate-700 focus:border-indigo-500/70'
                            }`}
                        />
                        {locationLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 size={14} className="text-indigo-400 animate-spin" />
                            </div>
                        )}
                        
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}
                                        className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                                    >
                                        <MapPin size={12} className="text-slate-500 shrink-0" />
                                        <span>{s.label}</span>
                                        {s.sublabel && (
                                            <span className="ml-auto text-[11px] text-slate-500 font-medium bg-slate-700/60 px-1.5 py-0.5 rounded">
                                                {s.sublabel}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={isLoading || !location.trim() || selectedCategories.length === 0}
                    className="w-full md:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 min-w-[200px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Processando Massa...
                        </>
                    ) : (
                        <>
                            <Layers size={16} />
                            Iniciar Busca em Massa
                        </>
                    )}
                </button>
            </div>
            
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
        </div>
    )
}
