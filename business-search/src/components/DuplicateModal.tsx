import { AlertTriangle, X } from 'lucide-react'
import { Business } from '../types/business'

interface DuplicateModalProps {
    business: Business
    onConfirm: () => void
    onCancel: () => void
}

export default function DuplicateModal({ business, onConfirm, onCancel }: DuplicateModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 w-full max-w-md fade-in shadow-2xl shadow-black/50">
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white">Lead já capturado</h2>
                        <p className="text-xs text-slate-400">Este lead já existe na sua base</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="ml-auto p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Business info */}
                <div className="bg-slate-800/60 rounded-xl p-4 mb-5 border border-slate-700/50">
                    <p className="text-sm font-semibold text-white">{business.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{business.address}</p>
                    {business.phone && <p className="text-xs text-slate-400 mt-0.5">{business.phone}</p>}
                </div>

                <p className="text-sm text-slate-300 mb-5">
                    Você já capturou este lead anteriormente. Deseja capturar novamente mesmo assim?
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-600 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-sm text-yellow-300 hover:bg-yellow-500/30 transition-all font-medium"
                    >
                        Capturar mesmo assim
                    </button>
                </div>
            </div>
        </div>
    )
}
