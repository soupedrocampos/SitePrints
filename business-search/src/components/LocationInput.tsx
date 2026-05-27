import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, X } from 'lucide-react'
import { api } from '../services/api'

interface Suggestion {
    description: string
    placeId: string
}

interface LocationInputProps {
    onLocationChange: (location: string) => void
    initialValue?: string
}

const CEP_RE = /^\d{5}-?\d{3}$/

export function LocationInput({ onLocationChange, initialValue = '' }: LocationInputProps) {
    const [value, setValue] = useState(initialValue)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [open, setOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchSuggestions = useCallback(async (input: string) => {
        if (input.length < 2) { setSuggestions([]); setOpen(false); return }

        if (CEP_RE.test(input)) {
            const cep = input.replace('-', '')
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                const data = await res.json()
                if (!data.erro) {
                    const city = `${data.localidade}, ${data.uf}`
                    setValue(city)
                    onLocationChange(city)
                    setSuggestions([])
                    setOpen(false)
                }
            } catch { /* ignore */ }
            return
        }

        try {
            const { data } = await api.get<Array<{ description: string; placeId: string }>>('/places/autocomplete', {
                params: { input, country: 'BR' },
            })
            setSuggestions(data)
            setOpen(data.length > 0)
        } catch {
            setSuggestions([])
        }
    }, [onLocationChange])

    const handleChange = (val: string) => {
        setValue(val)
        onLocationChange(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 350)
    }

    const handleSelect = (s: Suggestion) => {
        setValue(s.description)
        onLocationChange(s.description)
        setSuggestions([])
        setOpen(false)
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Cidade, bairro ou CEP..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                {value && (
                    <button
                        onClick={() => { setValue(''); onLocationChange(''); setSuggestions([]); setOpen(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-30 shadow-xl">
                    {suggestions.map((s) => (
                        <button
                            key={s.placeId}
                            onClick={() => handleSelect(s)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                        >
                            <MapPin size={13} className="text-indigo-400 shrink-0" />
                            {s.description}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
