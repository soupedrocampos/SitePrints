import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, ChevronDown, Clock, X, Sliders, Loader2 } from 'lucide-react'
import { BusinessType } from '../types/business'

const ALL_TYPES: BusinessType[] = ['Restaurante', 'Hotel', 'Varejo', 'Serviços', 'Saúde', 'Educação']

const typeEmojis: Record<string, string> = {
    Restaurante: '🍽️',
    Hotel: '🏨',
    Varejo: '🛍️',
    Serviços: '⚙️',
    Saúde: '🏥',
    Educação: '📚',
}

interface SearchFormProps {
    onSearch: (query: string, location: string, radius: number, types: BusinessType[]) => void
    isLoading: boolean
    recentSearches: string[]
}

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

/* ─── Static city suggestions for Brazil (offline fallback) ── */
const CITIES: Suggestion[] = [
    { label: 'São Paulo', sublabel: 'SP' },
    { label: 'Rio de Janeiro', sublabel: 'RJ' },
    { label: 'Belo Horizonte', sublabel: 'MG' },
    { label: 'Curitiba', sublabel: 'PR' },
    { label: 'Porto Alegre', sublabel: 'RS' },
    { label: 'Salvador', sublabel: 'BA' },
    { label: 'Fortaleza', sublabel: 'CE' },
    { label: 'Recife', sublabel: 'PE' },
    { label: 'Manaus', sublabel: 'AM' },
    { label: 'Belém', sublabel: 'PA' },
    { label: 'Goiânia', sublabel: 'GO' },
    { label: 'Florianópolis', sublabel: 'SC' },
    { label: 'Vitória', sublabel: 'ES' },
    { label: 'Maceió', sublabel: 'AL' },
    { label: 'Natal', sublabel: 'RN' },
    { label: 'Campo Grande', sublabel: 'MS' },
    { label: 'Teresina', sublabel: 'PI' },
    { label: 'João Pessoa', sublabel: 'PB' },
    { label: 'Aracaju', sublabel: 'SE' },
    { label: 'Porto Velho', sublabel: 'RO' },
    { label: 'Macapá', sublabel: 'AP' },
    { label: 'Boa Vista', sublabel: 'RR' },
    { label: 'Palmas', sublabel: 'TO' },
    { label: 'Rio Branco', sublabel: 'AC' },
    { label: 'São Luís', sublabel: 'MA' },
    { label: 'Cuiabá', sublabel: 'MT' },
    { label: 'Campinas', sublabel: 'SP' },
    { label: 'Santos', sublabel: 'SP' },
    { label: 'Uberlândia', sublabel: 'MG' },
    { label: 'Londrina', sublabel: 'PR' },
    { label: 'Maringá', sublabel: 'PR' },
    { label: 'Joinville', sublabel: 'SC' },
    { label: 'Blumenau', sublabel: 'SC' },
    { label: 'Sorocaba', sublabel: 'SP' },
    { label: 'São José dos Campos', sublabel: 'SP' },
    { label: 'Ribeirão Preto', sublabel: 'SP' },
    { label: 'Osasco', sublabel: 'SP' },
    { label: 'Santo André', sublabel: 'SP' },
    { label: 'São Bernardo do Campo', sublabel: 'SP' },
    { label: 'Guarulhos', sublabel: 'SP' },
]

export default function SearchForm({ onSearch, isLoading, recentSearches }: SearchFormProps) {
    const [query, setQuery] = useState('')
    const [location, setLocation] = useState('')
    const [radius, setRadius] = useState(10)
    const [selectedTypes, setSelectedTypes] = useState<BusinessType[]>([])
    const [showRecent, setShowRecent] = useState(false)

    // Location autocomplete state
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState('')

    const recentRef = useRef<HTMLDivElement>(null)
    const locationRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Update slider gradient
    const sliderStyle = {
        '--value': `${((radius - 1) / 49) * 100}%`,
    } as React.CSSProperties

    const toggleType = (type: BusinessType) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    const handleSearch = () => {
        if (!query.trim() && !location.trim()) return
        onSearch(query, location, radius, selectedTypes)
        setShowRecent(false)
        setShowSuggestions(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
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

        // Detect CEP (8 digits)
        if (raw.length >= 8 && /^\d+$/.test(raw)) {
            const formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`
            if (CEP_RE.test(formatted) || raw.length === 8) {
                debounceRef.current = setTimeout(() => lookupCEP(raw), 600)
                setSuggestions([])
                setShowSuggestions(false)
                return
            }
        }

        // Show city suggestions filtered by what the user typed
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

    /* ─── Pick a suggestion ──────────────────────────────── */
    const pickSuggestion = (s: Suggestion) => {
        const full = s.sublabel ? `${s.label}, ${s.sublabel}` : s.label
        setLocation(full)
        setSuggestions([])
        setShowSuggestions(false)
    }

    /* ─── Close dropdowns on outside click ──────────────── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
                setShowRecent(false)
            }
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className="glass rounded-2xl p-5 flex flex-col gap-5">
            {/* Header */}
            <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-400" />
                    Filtros de Busca
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure sua pesquisa de empresas</p>
            </div>

            {/* Query */}
            <div className="relative" ref={recentRef}>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Palavra-chave</label>
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => recentSearches.length > 0 && setShowRecent(true)}
                        placeholder="Ex: restaurantes, hotéis, clínicas"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Recent searches dropdown */}
                {showRecent && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
                        <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-700">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-[11px] text-slate-500 font-medium">Buscas recentes</span>
                        </div>
                        {recentSearches.slice(0, 5).map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setQuery(s); setShowRecent(false) }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                            >
                                <Clock size={12} className="text-slate-600" />
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Location */}
            <div ref={locationRef}>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Localização
                    <span className="ml-1 text-slate-600">· cidade, estado ou CEP</span>
                </label>
                <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={location}
                        onChange={handleLocationChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true)
                        }}
                        placeholder="Ex: São Paulo, SP ou 01310-100"
                        className={`w-full bg-slate-800/60 border rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${locationError
                            ? 'border-red-500/70 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
                            : 'border-slate-700 focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30'
                            }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {locationLoading && (
                            <Loader2 size={14} className="text-indigo-400 animate-spin" />
                        )}
                        {location && !locationLoading && (
                            <button
                                onClick={() => {
                                    setLocation('')
                                    setSuggestions([])
                                    setLocationError('')
                                }}
                                className="text-slate-500 hover:text-slate-300"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* City suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
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

                {/* Error */}
                {locationError && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <X size={11} /> {locationError}
                    </p>
                )}

                {/* CEP hint */}
                {!locationError && location.replace(/\D/g, '').length >= 5 && /^\d/.test(location) && (
                    <p className="text-xs text-slate-500 mt-1">
                        {locationLoading ? 'Buscando CEP...' : 'Digite 8 dígitos para resolver automaticamente'}
                    </p>
                )}
            </div>

            {/* Radius slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-400">Raio de busca</label>
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {radius} km
                    </span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={50}
                    value={radius}
                    style={sliderStyle}
                    onChange={(e) => setRadius(Number(e.target.value))}
                />
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">1 km</span>
                    <span className="text-[10px] text-slate-600">50 km</span>
                </div>
            </div>

            {/* Type chips */}
            <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Tipo de negócio</label>
                <div className="flex flex-wrap gap-2">
                    {ALL_TYPES.map((type) => {
                        const active = selectedTypes.includes(type)
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${active
                                    ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span>{typeEmojis[type]}</span>
                                {type}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Search button */}
            <button
                onClick={handleSearch}
                disabled={isLoading || (!query.trim() && !location.trim())}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Buscando...
                    </>
                ) : (
                    <>
                        <Search size={15} />
                        Buscar Empresas
                    </>
                )}
            </button>
        </div>
    )
}
