import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { Toast } from '../types/business'

interface ToastProps {
    toast: Toast
    onClose: (id: string) => void
}

const icons = {
    success: <CheckCircle size={16} className="text-emerald-400" />,
    error: <XCircle size={16} className="text-red-400" />,
    warning: <AlertCircle size={16} className="text-yellow-400" />,
}

const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
}

export function ToastItem({ toast, onClose }: ToastProps) {
    return (
        <div className={`toast glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-72 max-w-sm border ${borders[toast.type]}`}>
            {icons[toast.type]}
            <p className="text-sm text-slate-200 flex-1">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="text-slate-500 hover:text-white transition-colors ml-1"
            >
                <X size={14} />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onClose={onClose} />
            ))}
        </div>
    )
}
