import { useState, useRef, useEffect } from 'react'
import { MapPin, X, Map } from 'lucide-react'
import { formatLocationWithFlag } from '../utils/flags'

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
    const [isOpen, setIsOpen] = useState(false)
    const [filtered, setFiltered] = useState<Suggestion[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!value.trim()) {
            setFiltered(CITIES.slice(0, 5))
            return
        }
        const lower = value.toLowerCase()
        const res = CITIES.filter(c => 
            c.label.toLowerCase().includes(lower) || 
            c.sublabel?.toLowerCase().includes(lower)
        ).slice(0, 5)
        setFiltered(res)
    }, [value])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelect = (s: Suggestion) => {
        onChange(`${s.label}, ${s.sublabel}`)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative group">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Cidade, estado ou CEP..."
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-2xl fade-in-up">
                    <div className="px-3 py-1.5 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Map size={10} /> Sugestões
                        </span>
                    </div>
                    {filtered.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(s)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-200 transition-all flex items-center justify-between group"
                        >
                            <span className="font-medium">{formatLocationWithFlag(s.label)}</span>
                            {s.sublabel && <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 font-bold">{s.sublabel}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
