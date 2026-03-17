/**
 * cnpj.ts — CNPJ lookup via BrasilAPI (public, no key required).
 *           Falls back to internal API if VITE_API_BASE_URL is set.
 */
import axios from 'axios'

const BRASIL_API = import.meta.env.VITE_CNPJ_API_URL ?? 'https://brasilapi.com.br/api/cnpj/v1'

/* ─── Types ─────────────────────────────── */
export interface CNPJData {
    cnpj: string
    razaoSocial: string
    nomeFantasia?: string
    situacao: 'Ativa' | 'Inapta' | 'Suspensa' | 'Baixada'
    dataAbertura?: string
    naturezaJuridica?: string
    capitalSocial?: number
    porte?: string
    email?: string
    telefone?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    municipio?: string
    uf?: string
    cep?: string
    atividadePrincipal?: Array<{ code: string; text: string }>
    atividadesSecundarias?: Array<{ code: string; text: string }>
    qsa?: Array<{ nome: string; qual: string }>
}

export interface CNPJSearchResult {
    cnpj: string
    razaoSocial: string
    municipio?: string
    uf?: string
    confidence: number
}

/* ─── Service ────────────────────────────── */
export const cnpjService = {
    /** Direct CNPJ lookup — fetches from BrasilAPI */
    async lookup(cnpj: string): Promise<CNPJData> {
        const clean = cnpj.replace(/\D/g, '')
        const { data } = await axios.get<Record<string, unknown>>(`${BRASIL_API}/${clean}`)

        // Normalise BrasilAPI snake_case → camelCase subset we need
        return {
            cnpj: data.cnpj as string,
            razaoSocial: (data.razao_social ?? data.nome) as string,
            nomeFantasia: data.nome_fantasia as string | undefined,
            situacao: (data.descricao_situacao_cadastral ?? 'Ativa') as CNPJData['situacao'],
            dataAbertura: data.data_inicio_atividade as string | undefined,
            naturezaJuridica: (data.natureza_juridica as { descricao?: string })?.descricao,
            capitalSocial: data.capital_social as number | undefined,
            porte: (data.porte as { descricao?: string })?.descricao,
            email: data.email as string | undefined,
            telefone: data.ddd_telefone_1 as string | undefined,
            logradouro: data.logradouro as string | undefined,
            numero: data.numero as string | undefined,
            complemento: data.complemento as string | undefined,
            bairro: data.bairro as string | undefined,
            municipio: data.municipio as string | undefined,
            uf: data.uf as string | undefined,
            cep: data.cep as string | undefined,
            atividadePrincipal: data.cnae_fiscal_descricao
                ? [{ code: String(data.cnae_fiscal), text: data.cnae_fiscal_descricao as string }]
                : [],
            qsa: (data.qsa as Array<{ nome_socio: string; qualificacao_socio: { descricao: string } }> ?? []).map((q) => ({
                nome: q.nome_socio,
                qual: q.qualificacao_socio?.descricao ?? '',
            })),
        }
    },
}
