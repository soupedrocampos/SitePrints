import { X, Building2, Phone, Globe, Mail, MapPin, Calendar, Star } from 'lucide-react'
import { Lead, LeadStatus } from '../../types/lead'
import { STATUS_COLORS, qualityColor, formatDate } from '../../lib/leadHelpers'

const ALL_STATUSES: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Convertido', 'Rejeitado']

interface LeadModalProps {
    lead: Lead
    mode: 'view' | 'edit'
    onClose: () => void
    onSave: (updated: Lead) => void
}

export default function LeadModal({ lead, mode, onClose, onSave }: LeadModalProps) {
    const isEdit = mode === 'edit'

    const handleStatusChange = (status: LeadStatus) => onSave({ ...lead, status })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl w-full max-w-lg fade-in shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <Building2 size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-white">{lead.name}</h2>
                        <p className="text-[11px] text-slate-500">{lead.cnpj}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4">
                    {/* Status */}
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => isEdit && handleStatusChange(s)}
                                    className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${lead.status === s ? STATUS_COLORS[s] : 'border-slate-700 text-slate-500 hover:text-slate-300'
                                        } ${!isEdit ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] font-medium text-slate-500">Score de Qualidade</p>
                            <span className="text-xs font-bold text-white">{lead.quality}/100</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${qualityColor(lead.quality)}`} style={{ width: `${lead.quality}%` }} />
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: <MapPin size={12} />, label: 'Localização', value: `${lead.city}, ${lead.state}` },
                            { icon: <Calendar size={12} />, label: 'Criado em', value: formatDate(lead.created_at) },
                            { icon: <Phone size={12} />, label: 'Telefone', value: lead.phone || '—' },
                            { icon: <Mail size={12} />, label: 'E-mail', value: lead.email || '—' },
                        ].map(({ icon, label, value }) => (
                            <div key={label} className="bg-slate-800/40 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                    {icon}
                                    <span className="text-[10px]">{label}</span>
                                </div>
                                <p className="text-xs text-white truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Website */}
                    {lead.website && (
                        <div className="flex items-center gap-2 bg-slate-800/40 rounded-xl p-3">
                            <Globe size={12} className="text-slate-500 shrink-0" />
                            <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-indigo-400 hover:text-indigo-300 truncate underline underline-offset-2">
                                {lead.website}
                            </a>
                        </div>
                    )}

                    {/* Enrichment badge */}
                    <div className="flex items-center gap-2">
                        <Star size={12} className={lead.enriched ? 'text-emerald-400' : 'text-slate-600'} />
                        <span className={`text-xs ${lead.enriched ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {lead.enriched ? 'Dados enriquecidos' : 'Enriquecimento pendente'}
                        </span>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-yellow-500/60 mb-1">Notas</p>
                            <p className="text-xs text-yellow-200/80">{lead.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 pt-0">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
                        Fechar
                    </button>
                    {isEdit && (
                        <button onClick={() => onSave(lead)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition-all">
                            Salvar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
