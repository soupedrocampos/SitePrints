import { AnalysisHistoryEntry } from "../pages/WebsiteAnalysisPage";

export type SiteStatus = 'ok' | 'warning' | 'error' | 'ssl_issue' | 'generic';

export interface SiteAnalysis {
  id: string;
  businessName: string;
  website: string;
  status: SiteStatus;
  statusCode?: number;
  responseTime?: number;
  redirectCount?: number;
  ssl?: 'valid' | 'invalid' | 'missing';
  screenshotUrl?: string;
  screenshotTimestamp?: string;
  quality?: {
    aestheticScore: number;
    mobileScore: number;
    brokenImages: number;
    hasMetaDescription: boolean;
  };
}

export const mockAnalysisData: SiteAnalysis[] = [
  {
    id: '1',
    businessName: 'Restaurante Sabor & Arte',
    website: 'https://restaurantesaborarte.com.br',
    status: 'ok',
    statusCode: 200,
    responseTime: 850,
    redirectCount: 0,
    ssl: 'valid',
    screenshotUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2670&auto=format&fit=crop',
    screenshotTimestamp: '2024-03-12T14:30:00Z',
    quality: {
      aestheticScore: 92,
      mobileScore: 88,
      brokenImages: 0,
      hasMetaDescription: true
    }
  },
  {
    id: '2',
    businessName: 'Oficina do João',
    website: 'http://oficinajao.sites.com.br',
    status: 'warning',
    statusCode: 200,
    responseTime: 3200,
    redirectCount: 1,
    ssl: 'missing',
    screenshotUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2670&auto=format&fit=crop',
    screenshotTimestamp: '2024-03-12T14:35:00Z',
    quality: {
      aestheticScore: 45,
      mobileScore: 30,
      brokenImages: 4,
      hasMetaDescription: false
    }
  },
  {
    id: '3',
    businessName: 'Clínica Sorriso',
    website: 'https://clinicasorriso.med.br/erro',
    status: 'error',
    statusCode: 404,
    responseTime: 450,
    redirectCount: 0,
    ssl: 'valid',
    screenshotUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2670&auto=format&fit=crop',
    screenshotTimestamp: '2024-03-12T14:40:00Z',
    quality: {
      aestheticScore: 0,
      mobileScore: 0,
      brokenImages: 0,
      hasMetaDescription: false
    }
  },
  {
    id: '4',
    businessName: 'Padaria Central',
    website: 'https://padariacentral.com.br',
    status: 'ssl_issue',
    statusCode: 200,
    responseTime: 1200,
    redirectCount: 0,
    ssl: 'invalid',
    screenshotUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2672&auto=format&fit=crop',
    screenshotTimestamp: '2024-03-12T14:45:00Z',
    quality: {
      aestheticScore: 78,
      mobileScore: 65,
      brokenImages: 2,
      hasMetaDescription: true
    }
  }
];

export const getAnalysisSummary = (data: SiteAnalysis[]) => {
  return {
    total: data.length,
    ok: data.filter(d => d.status === 'ok').length,
    warning: data.filter(d => d.status === 'warning').length,
    error: data.filter(d => d.status === 'error').length,
    ssl: data.filter(d => d.status === 'ssl_issue').length,
    generic: data.filter(d => d.status === 'generic').length,
    avgResponseTime: data.length > 0 
      ? Math.round(data.reduce((acc, curr) => acc + (curr.responseTime || 0), 0) / data.length)
      : 0
  };
};

// Key for sessionStorage to persist data between page reloads
export const STORAGE_KEY = 'site_analysis_results';
export const HISTORY_KEY = 'site_analysis_history';

// Helper to save data
export const saveAnalysisResults = (results: SiteAnalysis[]) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(results));
};

// Helper to load data
export const loadAnalysisResults = (): SiteAnalysis[] => {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// Helper to clear data
export const clearAnalysisResults = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

// --- History Helpers ---

export const saveToHistory = (results: SiteAnalysis[], location: string, categories: string) => {
  try {
    const existing = sessionStorage.getItem(HISTORY_KEY);
    const history: AnalysisHistoryEntry[] = existing ? JSON.parse(existing) : [];
    
    const summary = getAnalysisSummary(results);
    
    const newEntry: AnalysisHistoryEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      location,
      categories,
      totalCount: results.length,
      sites: results,
      summary: {
        ok: summary.ok,
        warning: summary.warning,
        error: summary.error,
        ssl_issue: summary.ssl,
        generic: summary.generic
      }
    };
    
    // Keep only last 10 entries for history
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (e) {
    console.error('Failed to save history', e);
    return [];
  }
};

export const loadHistory = (): AnalysisHistoryEntry[] => {
  try {
    const saved = sessionStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load history', e);
    return [];
  }
};

export const clearHistory = () => {
  sessionStorage.removeItem(HISTORY_KEY);
};

// Generic UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
