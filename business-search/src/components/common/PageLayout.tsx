/**
 * PageLayout.tsx — Consistent page wrapper with NavBar and optional breadcrumb.
 */
import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import NavBar from '../NavBar'

/* ─── Breadcrumb types ───────────────────── */
export interface Crumb {
    label: string
    href?: string
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 mb-5">
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1
                return (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={12} className="text-slate-700" />}
                        {isLast || !crumb.href ? (
                            <span className={isLast ? 'text-slate-300 font-medium' : ''}>{crumb.label}</span>
                        ) : (
                            <Link to={crumb.href} className="hover:text-slate-300 transition-colors">
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}

/* ─── Route → auto breadcrumb map ───────── */
const ROUTE_LABELS: Record<string, string> = {
    '/': 'Dashboard',
    '/search': 'Busca',
    '/leads': 'Meus Leads',
    '/history': 'Histórico',
    '/cnpj-lookup': 'Buscar CNPJ',
    '/components': 'Componentes',
}

function useAutoCrumbs(): Crumb[] {
    const { pathname } = useLocation()
    const parts = pathname.split('/').filter(Boolean)

    const crumbs: Crumb[] = [{ label: 'Dashboard', href: '/' }]

    let path = ''
    for (const part of parts) {
        path = `/${part}`
        const label = ROUTE_LABELS[path] ?? part.charAt(0).toUpperCase() + part.slice(1)
        crumbs.push({ label, href: path })
    }

    return crumbs
}

/* ─── Layout ─────────────────────────────── */
interface Props {
    children: ReactNode
    crumbs?: Crumb[]
    autoCrumbs?: boolean
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
    className?: string
}

const MAX_W: Record<string, string> = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
}

export function PageLayout({
    children,
    crumbs,
    autoCrumbs = false,
    maxWidth = '2xl',
    className = '',
}: Props) {
    const autoCrumbList = useAutoCrumbs()
    const displayCrumbs = crumbs ?? (autoCrumbs ? autoCrumbList : undefined)

    return (
        <div className="min-h-screen bg-[#0a0f1e]">
            <NavBar />
            <main className={`pt-14 pb-10 px-4 ${MAX_W[maxWidth]} mx-auto ${className}`}>
                {displayCrumbs && displayCrumbs.length > 1 && (
                    <Breadcrumbs crumbs={displayCrumbs} />
                )}
                {children}
            </main>
        </div>
    )
}

export default PageLayout
