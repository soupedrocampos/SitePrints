/**
 * websiteAnalysisData.ts — Mock data for the Website Analysis Dashboard
 */

export type SiteStatus = 'ok' | 'warning' | 'error' | 'ssl_issue'
export type SSLStatus = 'valid' | 'expired' | 'missing' | 'warning'

export interface QualityMetrics {
    aestheticScore: number       // 0-100
    layoutScore: number          // 0-100
    colorScore: number           // 0-100
    mobileScore: number          // 0-100
    brokenImages: number
    hasFavicon: boolean
    hasMetaDescription: boolean
}

export interface SiteAnalysis {
    id: string
    businessName: string
    website: string
    address: string
    rating: number
    ratingCount: number
    businessType: string
    // Check results
    status: SiteStatus
    statusCode: number | null
    responseTime: number | null  // ms
    redirectCount: number
    ssl: SSLStatus
    // Screenshot
    screenshotUrl: string | null
    screenshotTimestamp: string
    screenshotError?: string
    // Quality
    quality: QualityMetrics
    // Meta
    analyzedAt: string
    selected?: boolean
}

/* ─── Helpers ────────────────────────────── */
function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/* ─── Mock screenshot placeholder images via picsum ─── */
const SCREENSHOTS = [
    'https://picsum.photos/seed/site1/800/500',
    'https://picsum.photos/seed/site2/800/500',
    'https://picsum.photos/seed/site3/800/500',
    'https://picsum.photos/seed/site4/800/500',
    'https://picsum.photos/seed/site5/800/500',
    'https://picsum.photos/seed/site6/800/500',
    'https://picsum.photos/seed/site7/800/500',
    'https://picsum.photos/seed/site8/800/500',
    'https://picsum.photos/seed/site9/800/500',
    'https://picsum.photos/seed/site10/800/500',
    null, // screenshot failed
    null,
]

export const mockWebsiteAnalysis: SiteAnalysis[] = [
    {
        id: '1',
        businessName: 'Restaurante Bella Vista',
        website: 'https://bellavista.com.br',
        address: 'Av. Paulista, 1000 — São Paulo, SP',
        rating: 4.7, ratingCount: 432, businessType: 'Restaurante',
        status: 'ok', statusCode: 200, responseTime: 642, redirectCount: 0, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[0], screenshotTimestamp: '2026-02-28T13:10:00',
        quality: { aestheticScore: 88, layoutScore: 90, colorScore: 85, mobileScore: 92, brokenImages: 0, hasFavicon: true, hasMetaDescription: true },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '2',
        businessName: 'Hotel Central Park',
        website: 'https://hotelcentralpark.com.br',
        address: 'R. Augusta, 300 — São Paulo, SP',
        rating: 4.2, ratingCount: 198, businessType: 'Hotel',
        status: 'warning', statusCode: 200, responseTime: 4120, redirectCount: 2, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[1], screenshotTimestamp: '2026-02-28T13:10:15',
        quality: { aestheticScore: 62, layoutScore: 70, colorScore: 55, mobileScore: 45, brokenImages: 3, hasFavicon: true, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '3',
        businessName: 'Clínica Saúde Total',
        website: 'https://saudetotal.med.br',
        address: 'R. da Consolação, 2200 — São Paulo, SP',
        rating: 4.9, ratingCount: 871, businessType: 'Saúde',
        status: 'ok', statusCode: 200, responseTime: 389, redirectCount: 0, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[2], screenshotTimestamp: '2026-02-28T13:10:30',
        quality: { aestheticScore: 94, layoutScore: 96, colorScore: 90, mobileScore: 98, brokenImages: 0, hasFavicon: true, hasMetaDescription: true },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '4',
        businessName: 'Loja Fashion House',
        website: 'http://fashionhouse.com.br',
        address: 'Shopping Ibirapuera — São Paulo, SP',
        rating: 3.8, ratingCount: 56, businessType: 'Varejo',
        status: 'ssl_issue', statusCode: 200, responseTime: 1840, redirectCount: 1, ssl: 'missing',
        screenshotUrl: SCREENSHOTS[3], screenshotTimestamp: '2026-02-28T13:10:45',
        quality: { aestheticScore: 52, layoutScore: 48, colorScore: 60, mobileScore: 38, brokenImages: 7, hasFavicon: false, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '5',
        businessName: 'Academia FitLife',
        website: 'https://fitlife.com.br',
        address: 'R. Vergueiro, 1500 — São Paulo, SP',
        rating: 4.5, ratingCount: 223, businessType: 'Serviços',
        status: 'error', statusCode: 503, responseTime: null, redirectCount: 0, ssl: 'valid',
        screenshotUrl: null, screenshotTimestamp: '2026-02-28T13:11:00',
        screenshotError: 'Timeout ao capturar screenshot',
        quality: { aestheticScore: 0, layoutScore: 0, colorScore: 0, mobileScore: 0, brokenImages: 0, hasFavicon: false, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '6',
        businessName: 'Escola Futuro Brilhante',
        website: 'https://futurobrilhante.edu.br',
        address: 'Av. Brasil, 500 — Santo André, SP',
        rating: 4.6, ratingCount: 341, businessType: 'Educação',
        status: 'ok', statusCode: 200, responseTime: 720, redirectCount: 0, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[5], screenshotTimestamp: '2026-02-28T13:11:15',
        quality: { aestheticScore: 78, layoutScore: 80, colorScore: 75, mobileScore: 85, brokenImages: 1, hasFavicon: true, hasMetaDescription: true },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '7',
        businessName: 'Pizzaria Napolitana',
        website: 'https://pizzarianapolitana.com.br',
        address: 'R. Bela Cintra, 300 — São Paulo, SP',
        rating: 4.3, ratingCount: 612, businessType: 'Restaurante',
        status: 'warning', statusCode: 301, responseTime: 2800, redirectCount: 3, ssl: 'warning',
        screenshotUrl: SCREENSHOTS[6], screenshotTimestamp: '2026-02-28T13:11:30',
        quality: { aestheticScore: 55, layoutScore: 60, colorScore: 50, mobileScore: 40, brokenImages: 2, hasFavicon: true, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '8',
        businessName: 'Tech Solutions SP',
        website: 'https://techsolutionssp.com.br',
        address: 'Av. Faria Lima, 3000 — São Paulo, SP',
        rating: 4.8, ratingCount: 127, businessType: 'Serviços',
        status: 'ok', statusCode: 200, responseTime: 310, redirectCount: 0, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[7], screenshotTimestamp: '2026-02-28T13:11:45',
        quality: { aestheticScore: 96, layoutScore: 98, colorScore: 94, mobileScore: 97, brokenImages: 0, hasFavicon: true, hasMetaDescription: true },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '9',
        businessName: 'Farmácia Popular',
        website: 'https://farmaciapopular.com.br',
        address: 'R. da Saúde, 80 — São Paulo, SP',
        rating: 3.9, ratingCount: 88, businessType: 'Saúde',
        status: 'error', statusCode: 404, responseTime: 120, redirectCount: 0, ssl: 'valid',
        screenshotUrl: null, screenshotTimestamp: '2026-02-28T13:12:00',
        screenshotError: 'Página retornou erro 404',
        quality: { aestheticScore: 0, layoutScore: 0, colorScore: 0, mobileScore: 0, brokenImages: 0, hasFavicon: false, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '10',
        businessName: 'Boutique Milano',
        website: 'https://boutiquemilano.com.br',
        address: 'R. Oscar Freire, 700 — São Paulo, SP',
        rating: 4.9, ratingCount: 201, businessType: 'Varejo',
        status: 'ok', statusCode: 200, responseTime: 510, redirectCount: 0, ssl: 'valid',
        screenshotUrl: SCREENSHOTS[9], screenshotTimestamp: '2026-02-28T13:12:15',
        quality: { aestheticScore: 91, layoutScore: 93, colorScore: 88, mobileScore: 90, brokenImages: 0, hasFavicon: true, hasMetaDescription: true },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '11',
        businessName: 'Colégio São Paulo',
        website: 'https://colegiosaopaulo.com.br',
        address: 'Av. São João, 100 — São Paulo, SP',
        rating: 4.4, ratingCount: 523, businessType: 'Educação',
        status: 'ssl_issue', statusCode: 200, responseTime: 1650, redirectCount: 0, ssl: 'expired',
        screenshotUrl: SCREENSHOTS[4], screenshotTimestamp: '2026-02-28T13:12:30',
        quality: { aestheticScore: 44, layoutScore: 50, colorScore: 40, mobileScore: 35, brokenImages: 5, hasFavicon: true, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
    {
        id: '12',
        businessName: 'Bar do Zé',
        website: 'http://bardoze.com.br',
        address: 'R. Fidalga, 90 — São Paulo, SP',
        rating: 4.1, ratingCount: 334, businessType: 'Restaurante',
        status: 'warning', statusCode: 200, responseTime: 3500, redirectCount: 1, ssl: 'missing',
        screenshotUrl: SCREENSHOTS[8], screenshotTimestamp: '2026-02-28T13:12:45',
        quality: { aestheticScore: 35, layoutScore: 30, colorScore: 45, mobileScore: 28, brokenImages: 9, hasFavicon: false, hasMetaDescription: false },
        analyzedAt: '2026-02-28T13:15:00',
    },
]

/* ─── Summary stats ──────────────────────── */
export function getAnalysisSummary(data: SiteAnalysis[]) {
    return {
        total: data.length,
        ok: data.filter(d => d.status === 'ok').length,
        warning: data.filter(d => d.status === 'warning').length,
        error: data.filter(d => d.status === 'error').length,
        sslIssue: data.filter(d => d.status === 'ssl_issue').length,
        avgResponseTime: Math.round(
            data.filter(d => d.responseTime !== null).reduce((s, d) => s + (d.responseTime ?? 0), 0) /
            Math.max(1, data.filter(d => d.responseTime !== null).length)
        ),
        avgQuality: Math.round(
            data.filter(d => d.quality.aestheticScore > 0).reduce((s, d) => s + d.quality.aestheticScore, 0) /
            Math.max(1, data.filter(d => d.quality.aestheticScore > 0).length)
        ),
    }
}
