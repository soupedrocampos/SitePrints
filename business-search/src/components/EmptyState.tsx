import { SearchX } from 'lucide-react'

interface EmptyStateProps {
    hasSearched: boolean
    location?: string
}

export default function EmptyState({ hasSearched, location }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                <SearchX size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
                {hasSearched
                    ? location
                        ? `Nenhuma empresa encontrada em ${location}`
                        : 'Nenhuma empresa encontrada'
                    : 'Faça uma busca para começar'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
                {hasSearched
                    ? 'Tente ajustar os filtros ou use uma palavra-chave mais genérica.'
                    : 'Use o formulário ao lado para buscar empresas e capturar leads.'}
            </p>
        </div>
    )
}
