import { Users, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LeadsEmptyStateProps {
    mode: 'no-leads' | 'no-results'
    onClearFilters?: () => void
}

export default function LeadsEmptyState({ mode, onClearFilters }: LeadsEmptyStateProps) {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center py-24 text-center fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                {mode === 'no-leads' ? (
                    <Users size={26} className="text-indigo-400" />
                ) : (
                    <Search size={26} className="text-indigo-400" />
                )}
            </div>

            <h3 className="text-base font-semibold text-white mb-2">
                {mode === 'no-leads' ? 'Nenhum lead ainda' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-6">
                {mode === 'no-leads'
                    ? 'Comece buscando empresas no Business Search e capturando seus primeiros leads.'
                    : 'Nenhum lead corresponde aos filtros selecionados. Tente ajustar ou limpar os filtros.'}
            </p>

            {mode === 'no-leads' ? (
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                >
                    Ir para Business Search
                </button>
            ) : (
                <button
                    onClick={onClearFilters}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                    Limpar Filtros
                </button>
            )}
        </div>
    )
}
