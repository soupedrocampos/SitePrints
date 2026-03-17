import { Lead, LeadStatus, LeadSource } from '../types/lead'

const statuses: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Convertido', 'Rejeitado']
const sources: LeadSource[] = ['Google Maps', 'Manual', 'Import']
const cities = [
    { city: 'São Paulo', state: 'SP' }, { city: 'Rio de Janeiro', state: 'RJ' },
    { city: 'Belo Horizonte', state: 'MG' }, { city: 'Salvador', state: 'BA' },
    { city: 'Fortaleza', state: 'CE' }, { city: 'Curitiba', state: 'PR' },
    { city: 'Recife', state: 'PE' }, { city: 'Manaus', state: 'AM' },
    { city: 'Porto Alegre', state: 'RS' }, { city: 'Goiânia', state: 'GO' },
]

function randomCNPJ() {
    const n = () => Math.floor(Math.random() * 9)
    return `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/${n()}${n()}${n()}${n()}-${n()}${n()}`
}

function randomDate(daysBack = 120) {
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack))
    return d.toISOString()
}

const companies = [
    'Famiglia Mancini Trattoria', 'Vicolo Nostro', 'Terraço Itália', 'Osteria Generale',
    'Modern Mamma Osteria', 'Hilton Barra Rio', 'Hotel Atlântico Business',
    'Hotel Nacional RJ', 'Copacabana Palace', 'Por el Mundo Hostel',
    'Clínica São Lucas', 'Colégio Progresso', 'Restaurante Mangai', 'Posto Ipiranga',
    'Farmácia Nissei', 'Magazine Luiza Centro', 'Pizzaria Beto', 'Supermercado Extra',
    'Academia Smart Fit', 'Clínica Odontológica Sorriso', 'Bar do Zé', 'Pão de Queijo',
    'Escritório Contábil Silva', 'Mecânica do João', 'Salão Beleza Natural',
    'Pet Shop Animal Love', 'Lavanderia Express', 'Gráfica Rápida', 'Tech Solutions BR',
    'Agência Criativa Pixel',
]

export const mockLeads: Lead[] = companies.map((name, i) => {
    const loc = cities[i % cities.length]
    const isEnriched = i % 3 !== 1
    return {
        id: `lead-${i + 1}`,
        name,
        tradeName: i % 4 === 0 ? name.split(' ')[0] : undefined,
        cnpj: randomCNPJ(),
        status: statuses[i % statuses.length],
        source: sources[i % sources.length],
        quality: Math.floor(20 + Math.random() * 80),
        city: loc.city,
        state: loc.state,
        phone: `(${10 + (i % 89)}) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
        website: i % 3 !== 0 ? `https://www.${name.toLowerCase().replace(/\s+/g, '')}.com.br` : undefined,
        email: i % 2 === 0 ? `contato@${name.toLowerCase().replace(/[\s\-]/g, '')}.com.br` : undefined,
        address: `Rua ${['das Flores', 'XV de Novembro', 'das Palmeiras', 'da Liberdade'][i % 4]}, ${100 + i * 7} - ${loc.city}`,
        enriched: isEnriched,
        created_at: randomDate(),
        notes: i % 4 === 0 ? 'Cliente interessado. Follow-up agendado.' : undefined,
        cnpjEnrichment: isEnriched ? {
            status: 'enriched',
            lastEnrichedAt: randomDate(30),
            matchConfidence: 85 + (i % 15),
            legalName: name.toUpperCase() + ' LTDA',
            cnaePrimary: { code: '5611-2/01', description: 'Restaurantes e similares' },
            cnaeSecondary: [
                { code: '5620-1/01', description: 'Fornecimento de alimentos preparados' },
                { code: '4729-6/99', description: 'Comércio varejista de produtos alimentícios' },
            ],
            companySize: ['MEI', 'ME', 'EPP', 'Média Empresa'][i % 4],
            legalNature: 'Sociedade Empresária Limitada',
            foundingDate: `${2000 + (i % 23)}-0${1 + (i % 9)}-15`,
            shareCapital: 10000 * (1 + i % 50),
            simplesNacional: i % 2 === 0,
            mei: i % 4 === 0,
            companyStatus: i % 7 === 0 ? 'Inapta' : 'Ativa',
            address: {
                street: `Rua ${['das Flores', 'XV de Novembro', 'das Palmeiras', 'da Liberdade'][i % 4]}`,
                number: String(100 + i * 7),
                neighborhood: 'Centro',
                city: loc.city, state: loc.state, zip: `${10000 + i * 111}-${100 + i}`,
            },
        } : { status: i % 5 === 0 ? 'failed' : 'pending' },
        placesData: sources[i % sources.length] === 'Google Maps' ? {
            placeId: `ChIJ${Math.random().toString(36).slice(2, 12)}`,
            rating: 3.5 + Math.random() * 1.5,
            reviewCount: 10 + Math.floor(Math.random() * 500),
            types: ['restaurant', 'food', 'establishment'].slice(0, 1 + (i % 3)),
            mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(name)}`,
        } : undefined,
        activities: [
            {
                id: `act-${i}-1`, type: 'created', description: 'Lead capturado via Business Search',
                user: 'Sistema', timestamp: randomDate(),
            },
            ...(i % 3 === 0 ? [{
                id: `act-${i}-2`, type: 'note' as const,
                description: 'Cliente demonstrou interesse no produto. Agendar demo.',
                user: 'João Silva', timestamp: randomDate(20),
            }] : []),
            ...(i % 2 === 0 ? [{
                id: `act-${i}-3`, type: 'call' as const,
                description: 'Ligação realizada. Sem resposta. Tentar novamente amanhã.',
                user: 'Ana Souza', timestamp: randomDate(10),
            }] : []),
        ],
        dataQuality: {
            completeness: 40 + (i * 7 % 60),
            flags: [
                ...(i % 3 === 0 ? ['Telefone não validado'] : []),
                ...(i % 4 === 0 ? ['Website sem HTTPS'] : []),
                ...(i % 5 === 0 ? ['CNPJ não confirmado com Receita Federal'] : []),
            ],
            addressDiscrepancy: i % 6 === 0 ? 'Endereço do Google Places difere da Receita Federal' : undefined,
        },
    }
})
