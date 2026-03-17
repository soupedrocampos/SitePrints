import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        if (totalPages <= 5) return i + 1
        if (page <= 3) return i + 1
        if (page >= totalPages - 2) return totalPages - 4 + i
        return page - 2 + i
    })

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={16} />
            </button>

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${p === page
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50'
                        }`}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}
