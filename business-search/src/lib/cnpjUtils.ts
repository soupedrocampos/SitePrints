/**
 * CNPJ utilities: masking, validation (checksum), and mock API
 */

/** Apply XX.XXX.XXX/XXXX-XX mask as user types */
export function maskCNPJInput(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Strip everything non-digit */
export function stripCNPJ(masked: string) {
    return masked.replace(/\D/g, '')
}

/** Official CNPJ checksum validation */
export function isValidCNPJ(raw: string): boolean {
    const d = raw.replace(/\D/g, '')
    if (d.length !== 14) return false
    // All same digit = invalid
    if (/^(\d)\1+$/.test(d)) return false

    const calc = (len: number) => {
        let sum = 0
        let pos = len - 7
        for (let i = len; i >= 1; i--) {
            sum += Number(d[len - i]) * pos--
            if (pos < 2) pos = 9
        }
        return sum % 11 < 2 ? 0 : 11 - (sum % 11)
    }
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

/* ─── Mock company data keyed by digits ──────────────── */
export interface CompanyData {
    cnpj: string
    legalName: string
    tradeName?: string
    status: 'Ativa' | 'Inativa' | 'Baixada' | 'Suspensa'
    cnaePrimary: string
    cnaeCode: string
    companySize: string
    legalNature: string
    foundingDate: string
    address: string
    city: string
    state: string
}

const MOCK_COMPANIES: Record<string, CompanyData> = {
    '11222333000181': {
        cnpj: '11.222.333/0001-81',
        legalName: 'RESTAURANTE E PIZZARIA BELLA NAPOLI LTDA',
        tradeName: 'Bella Napoli Pizzaria',
        status: 'Ativa',
        cnaePrimary: 'Restaurantes e similares',
        cnaeCode: '5611-2/01',
        companySize: 'Microempresa',
        legalNature: 'Sociedade Empresária Limitada',
        foundingDate: '2010-03-22',
        address: 'Rua das Flores, 123 - Jardim Paulista',
        city: 'São Paulo', state: 'SP',
    },
    '22333444000100': {
        cnpj: '22.333.444/0001-00',
        legalName: 'FARMÁCIA DROGARIA SAÚDE E VIDA EIRELI',
        tradeName: 'Drogaria Saúde e Vida',
        status: 'Inativa',
        cnaePrimary: 'Comércio varejista de produtos farmacêuticos',
        cnaeCode: '4771-7/01',
        companySize: 'Empresa de Pequeno Porte',
        legalNature: 'Empresário Individual de Responsabilidade Limitada',
        foundingDate: '2008-11-05',
        address: 'Av. Central, 456 - Centro',
        city: 'Rio de Janeiro', state: 'RJ',
    },
}

// Name search mock database
export interface NameSearchResult {
    id: string
    legalName: string
    tradeName?: string
    cnpj: string
    city: string
    state: string
    confidence: number
}

const NAME_SEARCH_MOCK: NameSearchResult[] = [
    { id: '1', legalName: 'FAMIGLIA MANCINI TRATTORIA LTDA', tradeName: 'Famiglia Mancini', cnpj: '12.345.678/0001-90', city: 'São Paulo', state: 'SP', confidence: 98 },
    { id: '2', legalName: 'FAMILIA MANCINI RESTAURANTE E BAR EIRELI', tradeName: 'Família Mancini Bar', cnpj: '98.765.432/0001-10', city: 'Campinas', state: 'SP', confidence: 85 },
    { id: '3', legalName: 'MANCINI EVENTOS E GASTRONOMIA LTDA', cnpj: '55.444.333/0001-22', city: 'Santos', state: 'SP', confidence: 72 },
    { id: '4', legalName: 'TECH SOLUTIONS BRASIL LTDA', tradeName: 'TechBR', cnpj: '33.222.111/0001-44', city: 'Porto Alegre', state: 'RS', confidence: 95 },
    { id: '5', legalName: 'TECNOLOGIA E SOLUÇÕES DO BRASIL S/A', cnpj: '77.666.555/0001-33', city: 'Belo Horizonte', state: 'MG', confidence: 80 },
]

/* ─── Mock API calls ─────────────────────────────────── */
export async function fetchByCNPJ(cnpj: string): Promise<CompanyData> {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600))

    const digits = cnpj.replace(/\D/g, '')
    const known = MOCK_COMPANIES[digits]
    if (known) return known

    // Generate a plausible result for any valid CNPJ
    const n = digits.charCodeAt(0) % 4
    const sizes = ['MEI', 'Microempresa', 'Empresa de Pequeno Porte', 'Média Empresa']
    const cities = [{ city: 'São Paulo', state: 'SP' }, { city: 'Rio de Janeiro', state: 'RJ' }, { city: 'Curitiba', state: 'PR' }, { city: 'Fortaleza', state: 'CE' }]
    const loc = cities[n]
    return {
        cnpj: cnpj.replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
        legalName: `EMPRESA GERADA AUTOMATICAMENTE ${digits.slice(-6)} LTDA`,
        tradeName: undefined,
        status: n === 1 ? 'Inativa' : 'Ativa',
        cnaePrimary: ['Restaurantes e similares', 'Comércio varejista', 'Serviços de TI', 'Construção civil'][n],
        cnaeCode: ['5611-2/01', '4729-6/99', '6201-5/00', '4120-4/00'][n],
        companySize: sizes[n],
        legalNature: 'Sociedade Empresária Limitada',
        foundingDate: `${2000 + n * 4}-0${1 + n}-15`,
        address: `Rua ${['das Flores', 'XV de Novembro', 'das Palmeiras', 'da Liberdade'][n]}, ${100 + Number(digits.slice(-3))}`,
        city: loc.city, state: loc.state,
    }
}

export async function searchByName(name: string, state: string): Promise<NameSearchResult[]> {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 400))
    const q = name.toLowerCase()
    return NAME_SEARCH_MOCK.filter(
        (c) =>
            (c.legalName.toLowerCase().includes(q) || (c.tradeName?.toLowerCase().includes(q) ?? false)) &&
            (!state || c.state === state)
    ).sort((a, b) => b.confidence - a.confidence)
}
