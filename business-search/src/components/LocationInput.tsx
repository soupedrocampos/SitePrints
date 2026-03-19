import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'

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

/* ─── Static city suggestions for Brazil ── */
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

interface LocationInputProps {
    value: string
    onChange: (val: string) => void
    className?: string
}

export default function LocationInput({ value, onChange, className = '' }: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const lookupCEP = useCallback(async (cep: string) => {
        setLoading(true)
        setError('')
        try {
            const clean = cep.replace(/\D/g, '')
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
            const data: ViaCEPResponse = await res.json()
            if (data.erro) {
                setError('CEP não encontrado')
                setSuggestions([])
            } else {
                const city = `${data.localidade}, ${data.uf}`
                onChange(city)
                setSuggestions([])
                setShowSuggestions(false)
                setError('')
            }
        } catch {
            setError('Erro ao buscar CEP')
        } finally {
            setLoading(false)
        }
    }, [onChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        onChange(val)
        setError('')

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
        onChange(full)
        setSuggestions([])
        setShowSuggestions(false)
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Ex: São Paulo, SP ou 01310-100"
                    className={`w-full bg-slate-800/60 border rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                        error ? 'border-red-500/70 focus:border-red-500/70' : 'border-slate-700/50 focus:border-indigo-500/70'
                    }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
                    {value && !loading && (
                        <button
                            onClick={() => {
                                onChange('')
                                setSuggestions([])
                                setError('')
                            }}
                            className="text-slate-500 hover:text-slate-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-[100] shadow-2xl">
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
            
            {error && (
                <p className="absolute top-full left-0 mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <X size={10} /> {error}
                </p>
            )}
        </div>
    )
}
