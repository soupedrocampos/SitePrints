import { useState } from 'react'
import { Download, Trash2, ChevronDown, X, Globe, MessageCircle, Sparkles } from 'lucide-react'
import { LeadStatus } from '../../types/lead'
import { STATUS_COLORS } from '../../lib/leadHelpers'

const ALL_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Convertido', 'Rejeitado']

interface BulkActionsBarProps {
    count: number
    onChangeStatus: (status: LeadStatus) => void
    onExport: () => void
    onDelete: () => void
    onClear: () => void
    onAnalyze?: () => void
    onDeduplicateAll?: () => void
    onCheckWhatsApp?: () => void
    isCheckingWhatsApp?: boolean
}

export default function BulkActionsBar({
    count, onChangeStatus, onExport, onDelete, onClear,
    onAnalyze, onDeduplicateAll, onCheckWhatsApp, isCheckingWhatsApp
}: BulkActionsBarProps) {
    const [showStatus, setShowStatus] = useState(false)

    return (
        <div className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl border border-indigo-500/30 fade-in flex-wrap">
            <span className="text-xs font-semibold text-indigo-300">{count} selecionado{count > 1 ? 's' : ''}</span>
            <div className="h-4 w-px bg-slate-700" />

            {/* Change status */}
            <div className="relative">
                <button
                    onClick={() => setShowStatus(!showStatus)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
                >
                    Alterar Status
                    <ChevronDown size={11} className={`transition-transform ${showStatus ? 'rotate-180' : ''}`} />
                </button>
                {showStatus && (
                    <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl min-w-36">
                        {ALL_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => { onChangeStatus(s); setShowStatus(false) }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2"
                            >
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s].split(' ')[0].replace('/20', '/80')}`} />
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Analyze Websites */}
            {onAnalyze && (
                <button
                    onClick={onAnalyze}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-xs text-cyan-300 hover:bg-cyan-600/30 transition-all font-semibold"
                >
                    <Globe size={12} />
                    Analisar Sites
                </button>
            )}

            {/* Check WhatsApp */}
            {onCheckWhatsApp && (
                <button
                    onClick={onCheckWhatsApp}
                    disabled={isCheckingWhatsApp}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                        ${isCheckingWhatsApp
                            ? 'bg-green-600/10 border-green-500/20 text-green-500/50 cursor-not-allowed'
                            : 'bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30'}`}
                >
                    <MessageCircle size={12} />
                    {isCheckingWhatsApp ? 'Verificando...' : 'Verificar WhatsApp'}
                </button>
            )}

            {/* Deduplicate */}
            {onDeduplicateAll && (
                <button
                    onClick={onDeduplicateAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs text-purple-300 hover:bg-purple-600/30 transition-all font-semibold"
                >
                    <Sparkles size={12} />
                    Remover Duplicados
                </button>
            )}

            <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
            >
                <Download size={12} />
                Exportar
            </button>

            <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-all"
            >
                <Trash2 size={12} />
                Excluir
            </button>

            <button onClick={onClear} className="ml-auto text-slate-500 hover:text-white">
                <X size={14} />
            </button>
        </div>
    )
}
