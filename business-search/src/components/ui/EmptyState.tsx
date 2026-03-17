/**
 * EmptyState
 * Centered empty state with SVG illustration, title, description, and CTA.
 * Variants cover the main data-empty scenarios in the app.
 */
import { Link } from 'react-router-dom'
import { Search, Users, History, FileSearch, Sparkles, Database } from 'lucide-react'

export type EmptyVariant = 'no-leads' | 'no-results' | 'no-history' | 'no-data' | 'error' | 'custom'

interface IllustrationProps {
    variant: EmptyVariant
    illustration?: React.ReactNode
}

/* ── Built-in SVG illustrations ── */
function Illustration({ variant, illustration }: IllustrationProps) {
    if (illustration) return <>{illustration}</>

    const iconMap: Record<EmptyVariant, React.ReactNode> = {
        'no-leads': (
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 flex items-center justify-center">
                    <Users size={32} className="text-slate-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkles size={13} className="text-indigo-400" />
                </div>
            </div>
        ),
        'no-results': (
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 flex items-center justify-center">
                    <Search size={32} className="text-slate-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <FileSearch size={13} className="text-amber-400" />
                </div>
            </div>
        ),
        'no-history': (
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 flex items-center justify-center">
                    <History size={32} className="text-slate-600" />
                </div>
            </div>
        ),
        'no-data': (
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 flex items-center justify-center">
                    <Database size={32} className="text-slate-600" />
                </div>
            </div>
        ),
        error: (
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-900/30 to-slate-900/80 border border-red-500/20 flex items-center justify-center">
                    <span className="text-4xl select-none">⚠️</span>
                </div>
            </div>
        ),
        custom: (
            <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
                <Sparkles size={32} className="text-slate-600" />
            </div>
        ),
    }

    return iconMap[variant] ?? iconMap.custom
}

/* ── Action Button / Link ── */
type ActionType = {
    label: string
    icon?: React.ReactNode
    variant?: 'primary' | 'secondary'
} & (
        | { href: string; onClick?: never }
        | { onClick: () => void; href?: never }
    )

function ActionButton({ action }: { action: ActionType }) {
    const isPrimary = action.variant !== 'secondary'
    const cls = `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isPrimary
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
            : 'border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600'
        }`

    if (action.href) {
        return <Link to={action.href} className={cls}>{action.icon}{action.label}</Link>
    }
    return <button onClick={action.onClick} className={cls}>{action.icon}{action.label}</button>
}

/* ── Props ── */
interface Props {
    variant?: EmptyVariant
    illustration?: React.ReactNode
    title: string
    description?: string
    actions?: ActionType[]
    className?: string
    /** Size: compact hides the illustration */
    compact?: boolean
}

/* ── Component ── */
export function EmptyState({
    variant = 'custom',
    illustration,
    title,
    description,
    actions = [],
    className = '',
    compact = false,
}: Props) {
    return (
        <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}>
            {!compact && (
                <div className="mb-5">
                    <Illustration variant={variant} illustration={illustration} />
                </div>
            )}

            <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>

            {description && (
                <p className={`text-slate-500 mt-1.5 max-w-xs leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                    {description}
                </p>
            )}

            {actions.length > 0 && (
                <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
                    {actions.map((action, i) => (
                        <ActionButton key={i} action={action} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default EmptyState
