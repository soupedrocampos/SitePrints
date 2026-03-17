import { Link, useLocation } from 'react-router-dom'
import { Building2, Users, LayoutDashboard, BarChart2, History, Globe } from 'lucide-react'

export default function NavBar() {
    const { pathname } = useLocation()

    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: <BarChart2 size={15} /> },
        { to: '/', label: 'Business Search', icon: <Building2 size={15} /> },
        { to: '/history', label: 'Histórico', icon: <History size={15} /> },
        { to: '/leads', label: 'Meus Leads', icon: <Users size={15} /> },
        { to: '/analysis', label: 'Análise Sites', icon: <Globe size={15} /> },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center border border-indigo-500/40">
                        <LayoutDashboard size={14} className="text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold text-white">CRM</span>
                    <span className="text-xs text-slate-600 font-medium">• Games</span>
                </div>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                    {links.map(({ to, label, icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${(
                                to === '/' ? pathname === '/' :
                                    to === '/leads' ? (pathname === '/leads' || pathname.startsWith('/leads/'))
                                        : pathname.startsWith(to)
                            )
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            {icon}
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
