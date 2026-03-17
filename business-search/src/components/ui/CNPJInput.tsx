/**
 * CNPJInput
 * Masked CNPJ input (XX.XXX.XXX/XXXX-XX) with real-time validation,
 * copy button, and validation icon.
 */
import { useState, useCallback, useId } from 'react'
import { Check, X, Copy, CheckCheck } from 'lucide-react'

/* ── CNPJ utils ───────────────────────────────── */
function maskCNPJ(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 14)
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
}

function validateCNPJ(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return false
    if (/^(\d)\1+$/.test(digits)) return false

    const calc = (d: string, len: number) => {
        let sum = 0
        let pos = len - 7
        for (let i = len; i >= 1; i--) {
            sum += parseInt(d.charAt(len - i)) * pos--
            if (pos < 2) pos = 9
        }
        const r = sum % 11
        return r < 2 ? 0 : 11 - r
    }

    const d1 = calc(digits, 12)
    if (d1 !== parseInt(digits.charAt(12))) return false
    const d2 = calc(digits, 13)
    return d2 === parseInt(digits.charAt(13))
}

/* ── Component ───────────────────────────────── */
interface Props {
    value?: string
    onChange?: (raw: string, masked: string, valid: boolean) => void
    disabled?: boolean
    placeholder?: string
    label?: string
    errorMessage?: string
    className?: string
}

export function CNPJInput({
    value: controlledValue,
    onChange,
    disabled = false,
    placeholder = 'XX.XXX.XXX/XXXX-XX',
    label,
    errorMessage,
    className = '',
}: Props) {
    const id = useId()
    const [internalValue, setInternalValue] = useState('')
    const [copied, setCopied] = useState(false)

    const masked = controlledValue !== undefined ? maskCNPJ(controlledValue) : internalValue
    const digits = masked.replace(/\D/g, '')
    const isComplete = digits.length === 14
    const isValid = isComplete && validateCNPJ(masked)
    const hasError = errorMessage || (isComplete && !isValid)

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newMasked = maskCNPJ(e.target.value)
        if (controlledValue === undefined) setInternalValue(newMasked)
        const raw = newMasked.replace(/\D/g, '')
        onChange?.(raw, newMasked, validateCNPJ(newMasked))
    }, [controlledValue, onChange])

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(masked)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch { /* ignore */ }
    }, [masked])

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative flex items-center">
                {/* Input */}
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    value={masked}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={18}
                    aria-invalid={!!hasError}
                    className={`
            w-full pr-20 pl-3.5 py-2.5 text-sm rounded-xl border font-mono transition-all
            bg-slate-800/60 text-white placeholder-slate-600
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                            : isValid
                                ? 'border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20'
                                : 'border-slate-700 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                        }
          `}
                />

                {/* Right icons */}
                <div className="absolute right-2.5 flex items-center gap-1.5">
                    {/* Validation icon */}
                    {isComplete && (
                        <span className={`flex-shrink-0 ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isValid ? <Check size={14} /> : <X size={14} />}
                        </span>
                    )}

                    {/* Copy */}
                    {masked.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            title="Copiar CNPJ"
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Hint / Error */}
            <div className="mt-1.5 min-h-[16px]">
                {hasError ? (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <X size={9} />
                        {errorMessage ?? 'CNPJ inválido — verifique os dígitos'}
                    </p>
                ) : isValid ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check size={9} />
                        CNPJ válido
                    </p>
                ) : (
                    <p className="text-[11px] text-slate-600">Formato: XX.XXX.XXX/XXXX-XX</p>
                )}
            </div>
        </div>
    )
}

export default CNPJInput
