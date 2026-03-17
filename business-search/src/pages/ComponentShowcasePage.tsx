/**
 * ComponentShowcase — live interactive demo of all shared UI components.
 * Route: /components
 */
import { useState } from 'react'
import { Search, Users, Package, Layers } from 'lucide-react'
import { LeadStatusBadge, LeadStatus } from '../components/ui/LeadStatusBadge'
import { QualityScoreIndicator } from '../components/ui/QualityScoreIndicator'
import { CNPJInput } from '../components/ui/CNPJInput'
import { SourceIcon, LeadSource } from '../components/ui/SourceIcon'
import { EnrichmentStatusBadge, EnrichmentStatus } from '../components/ui/EnrichmentStatusBadge'
import { EmptyState } from '../components/ui/EmptyState'

/* ── Section wrapper ──────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="glass rounded-2xl border border-slate-800 p-6">
            <div className="mb-5 pb-4 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">{title}</h2>
                {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
            </div>
            {children}
        </section>
    )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-[11px] text-slate-600 w-24 shrink-0">{label}</span>
            <div className="flex items-center gap-3 flex-wrap">{children}</div>
        </div>
    )
}

/* ── Page ─────────────────────────────── */
export default function ComponentShowcasePage() {
    const [cnpjValue, setCnpjValue] = useState('')
    const [scoreCircular, setScoreCircular] = useState(72)
    const [scoreLinear, setScoreLinear] = useState(45)

    const ALL_STATUSES: LeadStatus[] = ['novo', 'contatado', 'qualificado', 'convertido', 'rejeitado']
    const ALL_SOURCES: LeadSource[] = ['google_maps', 'manual', 'import']
    const ALL_ENRICHMENTS: EnrichmentStatus[] = ['pending', 'completed', 'failed']

    return (
        <div className="min-h-screen bg-[#0a0f1e] pt-14 pb-12">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-80 h-80 bg-indigo-600/4 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/4 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Layers size={16} className="text-indigo-400" />
                        <h1 className="text-lg font-bold text-white">Component Library</h1>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-medium">v1.0</span>
                    </div>
                    <p className="text-xs text-slate-500">Live showcase dos componentes reutilizáveis do sistema de prospecção.</p>
                </div>

                {/* 1 — LeadStatusBadge */}
                <Section title="LeadStatusBadge" description="Badge de status com ícone e tooltip descritivo. Passe o mouse para ver o tooltip.">
                    <Row label="All statuses">
                        {ALL_STATUSES.map(s => <LeadStatusBadge key={s} status={s} size="md" />)}
                    </Row>
                    <Row label="Sizes (novo)">
                        <LeadStatusBadge status="novo" size="sm" />
                        <LeadStatusBadge status="novo" size="md" />
                        <LeadStatusBadge status="novo" size="lg" />
                    </Row>
                    <Row label="No icon">
                        {ALL_STATUSES.map(s => <LeadStatusBadge key={s} status={s} size="sm" showIcon={false} />)}
                    </Row>
                </Section>

                {/* 2 — QualityScoreIndicator */}
                <Section title="QualityScoreIndicator" description="Indicador de qualidade circular (detalhe) ou linear (lista). Arraste os sliders para testar.">
                    <div className="grid grid-cols-2 gap-8">
                        {/* Circular */}
                        <div>
                            <p className="text-[11px] text-slate-500 mb-3">Circular — {scoreCircular}/100</p>
                            <div className="flex items-end gap-4 mb-3">
                                <QualityScoreIndicator score={scoreCircular} variant="circular" size={100} />
                                <QualityScoreIndicator score={scoreCircular} variant="circular" size={70} />
                                <QualityScoreIndicator score={scoreCircular} variant="circular" size={50} />
                            </div>
                            <input type="range" min={0} max={100} value={scoreCircular}
                                onChange={e => setScoreCircular(+e.target.value)}
                                className="w-full accent-indigo-500" />
                        </div>
                        {/* Linear */}
                        <div>
                            <p className="text-[11px] text-slate-500 mb-3">Linear — {scoreLinear}/100</p>
                            <div className="space-y-4 mb-3">
                                <QualityScoreIndicator score={20} variant="linear" />
                                <QualityScoreIndicator score={60} variant="linear" />
                                <QualityScoreIndicator score={scoreLinear} variant="linear" />
                            </div>
                            <input type="range" min={0} max={100} value={scoreLinear}
                                onChange={e => setScoreLinear(+e.target.value)}
                                className="w-full accent-indigo-500" />
                        </div>
                    </div>
                </Section>

                {/* 3 — CNPJInput */}
                <Section title="CNPJInput" description="Input com máscara automática, validação em tempo real e botão copiar.">
                    <div className="grid grid-cols-2 gap-4">
                        <CNPJInput
                            value={cnpjValue}
                            onChange={(_, masked) => setCnpjValue(masked)}
                            label="CNPJ"
                        />
                        <CNPJInput
                            value="11222333000181"
                            label="CNPJ Válido (pré-preenchido)"
                            onChange={() => { }}
                        />
                        <CNPJInput
                            value="12345678000100"
                            label="CNPJ Inválido"
                            onChange={() => { }}
                        />
                        <CNPJInput
                            value=""
                            label="Desabilitado"
                            disabled
                            onChange={() => { }}
                        />
                    </div>
                </Section>

                {/* 4 — SourceIcon */}
                <Section title="SourceIcon" description="Ícone de origem do lead com tooltip. Passe o mouse para ver o tooltip.">
                    <Row label="Icon only">
                        {ALL_SOURCES.map(s => <SourceIcon key={s} source={s} size="md" />)}
                    </Row>
                    <Row label="With label">
                        {ALL_SOURCES.map(s => <SourceIcon key={s} source={s} size="md" showLabel />)}
                    </Row>
                    <Row label="Sizes (maps)">
                        <SourceIcon source="google_maps" size="xs" />
                        <SourceIcon source="google_maps" size="sm" />
                        <SourceIcon source="google_maps" size="md" />
                        <SourceIcon source="google_maps" size="lg" />
                    </Row>
                </Section>

                {/* 5 — EnrichmentStatusBadge */}
                <Section title="EnrichmentStatusBadge" description="Badge de enriquecimento de dados. Pending tem pulsação animada. Failed mostra botão de retry.">
                    <Row label="All statuses">
                        <EnrichmentStatusBadge status="pending" />
                        <EnrichmentStatusBadge status="completed" lastEnriched={new Date('2026-02-28T10:30:00')} />
                        <EnrichmentStatusBadge
                            status="failed"
                            onRetry={() => new Promise(r => setTimeout(r, 1000))}
                        />
                    </Row>
                    <Row label="With dates">
                        <EnrichmentStatusBadge status="completed" lastEnriched={new Date('2026-02-27T08:00:00')} />
                        <EnrichmentStatusBadge status="pending" lastEnriched={new Date('2026-02-26T15:00:00')} />
                    </Row>
                </Section>

                {/* 6 — EmptyState */}
                <Section title="EmptyState" description="Estado vazio com ilustração, título, descrição e CTA.">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800">
                            <EmptyState
                                variant="no-leads"
                                title="Nenhum lead ainda"
                                description="Faça sua primeira busca para capturar leads."
                                actions={[{ label: 'Buscar Empresas', href: '/', icon: <Search size={13} /> }]}
                            />
                        </div>
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800">
                            <EmptyState
                                variant="no-results"
                                title="Sem resultados"
                                description="Tente ampliar o raio ou mudar os filtros."
                                actions={[{ label: 'Limpar filtros', onClick: () => { }, variant: 'secondary' }]}
                            />
                        </div>
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800">
                            <EmptyState
                                variant="no-history"
                                title="Histórico vazio"
                                description="Suas buscas aparecerão aqui."
                                actions={[{ label: 'Ir para busca', href: '/' }]}
                            />
                        </div>
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800">
                            <EmptyState
                                variant="error"
                                title="Algo deu errado"
                                description="Erro ao carregar dados. Tente novamente."
                                actions={[
                                    { label: 'Tentar novamente', onClick: () => { }, icon: <Package size={13} /> },
                                    { label: 'Voltar', href: '/', variant: 'secondary' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800">
                        <EmptyState
                            variant="no-leads"
                            title="Modo compacto"
                            description="Para usar em tabelas ou listas pequenas."
                            compact
                            actions={[{ label: 'Adicionar', onClick: () => { }, icon: <Users size={12} /> }]}
                        />
                    </div>
                </Section>
            </div>
        </div>
    )
}
