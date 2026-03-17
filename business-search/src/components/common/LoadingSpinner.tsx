/**
 * LoadingSpinner.tsx — Animated spinner with size variants and optional label.
 */
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLS: Record<SpinnerSize, string> = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-[3px]',
    xl: 'w-14 h-14 border-4',
}

interface Props {
    size?: SpinnerSize
    label?: string
    className?: string
    /** Full-page centered overlay */
    fullPage?: boolean
}

export function LoadingSpinner({ size = 'md', label, className = '', fullPage = false }: Props) {
    const spinner = (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div
                className={`rounded-full border-slate-700 border-t-indigo-500 animate-spin ${SIZE_CLS[size]}`}
            />
            {label && <p className="text-xs text-slate-500">{label}</p>}
        </div>
    )

    if (fullPage) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0a0f1e]/80 backdrop-blur-sm z-50">
                {spinner}
            </div>
        )
    }

    return spinner
}

export default LoadingSpinner
