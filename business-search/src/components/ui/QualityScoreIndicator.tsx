/**
 * QualityScoreIndicator
 * Circular or linear progress indicator for lead quality score (0–100).
 */

type Variant = 'circular' | 'linear'

interface Props {
    score: number          // 0-100
    variant?: Variant
    size?: number          // only for circular (diameter in px)
    showLabel?: boolean
    className?: string
}

function getColor(score: number) {
    if (score >= 75) return { stroke: '#10b981', text: 'text-emerald-400', bar: 'bg-emerald-500' }
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bar: 'bg-amber-500' }
    return { stroke: '#ef4444', text: 'text-red-400', bar: 'bg-red-500' }
}

function getLabel(score: number) {
    if (score >= 80) return 'Excelente'
    if (score >= 65) return 'Bom'
    if (score >= 50) return 'Regular'
    return 'Baixo'
}

/* ─ Circular variant ─ */
function CircularScore({ score, size = 80, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
    const { stroke, text } = getColor(score)
    const r = (size - 10) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ
    const center = size / 2

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Track */}
            <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                <circle
                    cx={center} cy={center} r={r}
                    fill="none"
                    stroke="rgba(148,163,184,0.1)"
                    strokeWidth={6}
                />
                <circle
                    cx={center} cy={center} r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={6}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            {/* Label */}
            {showLabel && (
                <div className="text-center z-10">
                    <p className={`font-bold leading-none ${text}`} style={{ fontSize: size * 0.22 }}>
                        {score}
                    </p>
                    <p className="text-slate-500 leading-none" style={{ fontSize: size * 0.12 }}>
                        {getLabel(score)}
                    </p>
                </div>
            )}
        </div>
    )
}

/* ─ Linear variant ─ */
function LinearScore({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
    const { bar, text } = getColor(score)
    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500">{getLabel(score)}</span>
                    <span className={`text-[11px] font-bold ${text}`}>{score}</span>
                </div>
            )}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${bar}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}

/* ─ Export ─ */
export function QualityScoreIndicator({ score, variant = 'circular', size = 80, showLabel = true, className = '' }: Props) {
    const clamped = Math.min(100, Math.max(0, score))
    return (
        <div className={className}>
            {variant === 'circular'
                ? <CircularScore score={clamped} size={size} showLabel={showLabel} />
                : <LinearScore score={clamped} showLabel={showLabel} />}
        </div>
    )
}

export default QualityScoreIndicator
