import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowUpDown, ArrowUp, ArrowDown, Check,
    Eye, Pencil, Trash2, MapPin, Globe, CheckSquare, Square, MessageCircle
} from 'lucide-react'
import { Lead, SortField, SortDir, LeadStatus, WhatsAppStatus } from '../../types/lead'
import { STATUS_COLORS, STATUS_DOT, qualityColor, formatDate } from '../../lib/leadHelpers'
import { formatLocationWithFlag } from '../../utils/flags'

const SOURCE_ICONS: Record<string, string> = {
    'Google Maps': '🗺️',
    'Manual': '✏️',
    'Import': '📥',
}

interface LeadsTableProps {
    leads: Lead[]
    totalLeads: number
    selected: Set<string>
    onSelect: (id: string) => void
    onSelectAll: (all: boolean) => void
    sortField: SortField
    sortDir: SortDir
    onSort: (field: SortField) => void
    onView: (lead: Lead) => void
    onEdit: (lead: Lead) => void
    onDelete: (id: string) => void
    visibleCols: Set<string>
    page: number
    perPage: number
    onPageChange: (p: number) => void
    onPerPageChange: (n: number) => void
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
    if (field !== sortField) return <ArrowUpDown size={12} className="text-slate-600" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-indigo-400" /> : <ArrowDown size={12} className="text-indigo-400" />
}


const COLS = [
    { id: 'name', label: 'Empresa' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'status', label: 'Status' },
    { id: 'quality', label: 'Score' },
    { id: 'city', label: 'Cidade/UF' },
    { id: 'created_at', label: 'Criado em' },
    { id: 'actions', label: 'Ações' },
]

const WA_CONFIG: Record<WhatsAppStatus, { label: string; cls: string; icon?: string }> = {
    unchecked: { label: 'Não verificado', cls: 'text-slate-500 bg-slate-800/60 border-slate-700' },
    checking: { label: 'Verificando…', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    valid: { label: '✓ Ativo', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    invalid: { label: '✗ Inativo', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export default function LeadsTable({
    leads, totalLeads, selected, onSelect, onSelectAll,
    sortField, sortDir, onSort, onView, onEdit, onDelete,
    visibleCols, page, perPage, onPageChange, onPerPageChange,
}: LeadsTableProps) {
    const totalPages = Math.ceil(totalLeads / perPage)
    const paginated = leads
    const allSelected = paginated.length > 0 && paginated.every((l) => selected.has(l.id))

    const thCls = 'px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap'
    const tdCls = 'px-3 py-2.5 text-xs text-slate-300'

    return (
        <div className="flex flex-col gap-3">
            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-800">
                            <tr>
                                {/* Checkbox */}
                                <th className="px-3 py-2.5 w-8">
                                    <button onClick={() => onSelectAll(!allSelected)} className="text-slate-500 hover:text-indigo-400">
                                        {allSelected ? <CheckSquare size={14} className="text-indigo-400" /> : <Square size={14} />}
                                    </button>
                                </th>
                                {COLS.filter((c) => visibleCols.has(c.id)).map((col) => (
                                    <th key={col.id} className={thCls}>
                                        {col.id !== 'actions' ? (
                                            <button
                                                onClick={() => col.id !== 'actions' && onSort(col.id as SortField)}
                                                className="flex items-center gap-1 hover:text-white transition-colors"
                                            >
                                                {col.label}
                                                <SortIcon field={col.id as SortField} sortField={sortField} sortDir={sortDir} />
                                            </button>
                                        ) : (
                                            <span>{col.label}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {paginated.map((lead) => (
                                <tr key={lead.id} className={`hover:bg-slate-800/30 transition-colors group ${selected.has(lead.id) ? 'bg-indigo-600/5' : ''}`}>
                                    {/* Checkbox */}
                                    <td className="px-3 py-2.5">
                                        <button onClick={() => onSelect(lead.id)} className="text-slate-500 hover:text-indigo-400">
                                            {selected.has(lead.id) ? <CheckSquare size={14} className="text-indigo-400" /> : <Square size={14} />}
                                        </button>
                                    </td>

                                    {/* Name */}
                                    {visibleCols.has('name') && (
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{SOURCE_ICONS[lead.source]}</span>
                                                <div>
                                                    <Link to={`/leads/${lead.id}`} className="text-white font-medium text-xs leading-tight hover:text-indigo-300 transition-colors">{lead.name}</Link>
                                                    <p className="text-[10px] text-slate-600">
                                                        {lead.source === 'Google Maps' && lead.website 
                                                            ? lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
                                                            : lead.source}
                                                    </p>
                                                </div>
                                                {lead.enriched && (
                                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded">
                                                        ✦ Enriq
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    )}

                                    {/* WhatsApp */}
                                    {visibleCols.has('whatsapp') && (
                                        <td className={tdCls}>
                                            {(() => {
                                                const waStatus = lead.whatsappStatus ?? 'unchecked'
                                                const cfg = WA_CONFIG[waStatus]
                                                return (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.cls}`}>
                                                            <MessageCircle size={9} />
                                                            {cfg.label}
                                                        </span>
                                                        {lead.phone && (
                                                            <span className="text-[10px] text-slate-600 pl-0.5">{lead.phone}</span>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                    )}

                                    {/* Status */}
                                    {visibleCols.has('status') && (
                                        <td className={tdCls}>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_COLORS[lead.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[lead.status]}`} />
                                                {lead.status}
                                            </span>
                                        </td>
                                    )}

                                    {/* Quality Score */}
                                    {visibleCols.has('quality') && (
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-2 min-w-20">
                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${qualityColor(lead.quality)} transition-all`}
                                                        style={{ width: `${lead.quality}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-slate-400 w-8 text-right">{lead.quality}</span>
                                            </div>
                                        </td>
                                    )}

                                    {/* City/State */}
                                    {visibleCols.has('city') && (
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-1">
                                                <MapPin size={10} className="text-slate-600 shrink-0" />
                                                <span className="text-[11px]">{formatLocationWithFlag(lead.city)}, <span className="text-slate-500">{lead.state}</span></span>
                                            </div>
                                        </td>
                                    )}

                                    {/* Created At */}
                                    {visibleCols.has('created_at') && (
                                        <td className={tdCls}>
                                            <span className="text-[11px] text-slate-500">{formatDate(lead.created_at)}</span>
                                        </td>
                                    )}

                                    {/* Actions */}
                                    {visibleCols.has('actions') && (
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/leads/${lead.id}`} title="Ver detalhes"
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                                                    <Eye size={13} />
                                                </Link>
                                                <a
                                                    href={lead.placesData?.placeId ? `https://www.google.com/maps/place/?q=place_id:${lead.placesData.placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || lead.city || ''}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                                    title="Ver no Google Maps"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MapPin size={13} />
                                                </a>
                                                <button onClick={() => onEdit(lead)} title="Editar"
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => onDelete(lead.id)} title="Excluir"
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Itens por página:</span>
                    <select
                        value={perPage}
                        onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1) }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                        {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-xs text-slate-600">
                        {Math.min((page - 1) * perPage + 1, leads.length)}–{Math.min(page * perPage, leads.length)} de {leads.length}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                        const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                        return (
                            <button key={p} onClick={() => onPageChange(p)}
                                className={`w-7 h-7 rounded-lg text-xs transition-all ${p === page ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                            >{p}</button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
