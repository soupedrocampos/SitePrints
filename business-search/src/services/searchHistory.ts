import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type SearchHistoryItem = {
    id: string;
    sessionId: string;
    query: string;
    location: string;
    timestamp: Date;
    radiusKm: number;
    types: string[];
    additionalFilters: string[];
    resultsFound: number;
    leadsCaptured: number;
    searchMode: 'simple' | 'mass';
    categories?: string[];
};

export type DateGroup = 'Hoje' | 'Ontem' | 'Última Semana' | 'Últimos 30 Dias';

export const getDateGroup = (date: Date): DateGroup => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000 / 60 / 60 / 24;
    
    if (diff < 1) return 'Hoje';
    if (diff < 2) return 'Ontem';
    if (diff < 7) return 'Última Semana';
    return 'Últimos 30 Dias';
};

export const relativeTime = (date: Date): string => {
    return format(date, "HH:mm", { locale: ptBR });
};

export const exportHistoryCSV = (items: SearchHistoryItem[]) => {
    const headers = ['Query', 'Localização', 'Data', 'Resultados', 'Leads', 'Modo'];
    const rows = items.map(i => [
        i.query,
        i.location,
        i.timestamp.toLocaleString('pt-BR'),
        i.resultsFound,
        i.leadsCaptured,
        i.searchMode
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_buscas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

class SearchHistoryService {
    private STORAGE_KEY = 'search_history_v1';

    getHistory(): SearchHistoryItem[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        try {
            const parsed = JSON.parse(stored);
            return parsed.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
        } catch (e) {
            console.error('Failed to parse search history', e);
            return [];
        }
    }

    saveHistoryItem(item: Omit<SearchHistoryItem, 'id' | 'sessionId' | 'timestamp' | 'leadsCaptured'>): SearchHistoryItem {
        const history = this.getHistory();
        const newItem: SearchHistoryItem = {
            ...item,
            id: Math.random().toString(36).substring(2, 9),
            sessionId: Math.random().toString(36).substring(2, 15),
            timestamp: new Date(),
            leadsCaptured: 0
        };
        
        const updated = [newItem, ...history].slice(0, 100); // Limit to 100 items
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        return newItem;
    }

    deleteHistoryItem(id: string) {
        const history = this.getHistory();
        const updated = history.filter(i => i.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }

    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export const searchHistoryService = new SearchHistoryService();
