import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  FileText,
  ChevronRight,
  RefreshCw,
  Globe,
  Smartphone,
  Shield,
  Trash2,
  MoreVertical,
  History,
  CheckSquare,
  Square,
  Play,
  MapPin
} from 'lucide-react';
import { 
  SiteAnalysis, 
  SiteStatus, 
  getAnalysisSummary, 
  saveAnalysisResults, 
  loadAnalysisResults,
  clearAnalysisResults,
  saveToHistory,
  loadHistory,
  clearHistory
} from '../lib/websiteAnalysisData';
import axios from 'axios';

// --- Types ---

export interface AnalysisHistoryEntry {
  id: string;
  date: string;
  location: string;
  categories: string;
  totalCount: number;
  sites: SiteAnalysis[];
  summary: {
    ok: number;
    warning: number;
    error: number;
    ssl_issue: number;
    generic: number;
  };
}

// --- Components ---

const statusConfig = (status: SiteStatus) => {
  switch (status) {
    case 'ok':
      return { 
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, 
        label: 'Bom', 
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' 
      };
    case 'warning':
      return { 
        icon: <AlertCircle className="w-4 h-4 text-amber-500" />, 
        label: 'Atenção', 
        classes: 'bg-amber-50 text-amber-700 border-amber-100' 
      };
    case 'error':
      return { 
        icon: <XCircle className="w-4 h-4 text-rose-500" />, 
        label: 'Erro', 
        classes: 'bg-rose-50 text-rose-700 border-rose-100' 
      };
    case 'ssl_issue':
      return { 
        icon: <Shield className="w-4 h-4 text-blue-500" />, 
        label: 'SSL', 
        classes: 'bg-blue-50 text-blue-700 border-blue-100' 
      };
    case 'generic':
      return { 
        icon: <Globe className="w-4 h-4 text-purple-500" />, 
        label: 'Genérico', 
        classes: 'bg-purple-50 text-purple-700 border-purple-100' 
      };
    default:
      return { 
        icon: <Clock className="w-4 h-4 text-gray-500" />, 
        label: 'Pendente', 
        classes: 'bg-gray-50 text-gray-700 border-gray-100' 
      };
  }
};

const SiteAnalysisCard = ({ analysis, isSelected, onToggleSelect }: { 
  analysis: SiteAnalysis; 
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) => {
  const config = statusConfig(analysis.status);
  
  return (
    <div className={`group relative bg-white rounded-xl border transition-all duration-300 hover:shadow-lg overflow-hidden ${isSelected ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-100'}`}>
      {/* Checkbox Overlay */}
      <button 
        onClick={() => onToggleSelect(analysis.id)}
        className="absolute top-3 left-3 z-10 p-1 rounded-md bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm transition-transform active:scale-95 group-hover:scale-110"
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-primary-600" />
        ) : (
          <Square className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Screenshot / Placeholder */}
      <div className="aspect-video w-full bg-gray-50 relative overflow-hidden">
        {analysis.screenshotUrl ? (
          <img 
            src={analysis.screenshotUrl} 
            alt={analysis.businessName} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Globe className="w-8 h-8 opacity-20" />
            <span className="text-xs font-medium opacity-50">Sem preview disponível</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg border backdrop-blur-md shadow-sm flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${config.classes}`}>
          {config.icon}
          {config.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {analysis.businessName}
            </h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${analysis.businessName}, ${analysis.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Abrir no Google Maps"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <a 
              href={analysis.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="truncate hover:text-primary-600 transition-colors"
            >
              {analysis.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] uppercase font-bold tracking-tight">Velocidade</span>
            </div>
            <div className={`text-sm font-bold ${analysis.responseTime && analysis.responseTime > 3000 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {analysis.responseTime ? `${analysis.responseTime}ms` : '---'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Shield className="w-3 h-3" />
              <span className="text-[10px] uppercase font-bold tracking-tight">Segurança</span>
            </div>
            <div className={`text-sm font-bold ${analysis.ssl === 'valid' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {analysis.ssl === 'valid' ? 'SSL Válido' : analysis.ssl === 'invalid' ? 'Erro SSL' : 'Inseguro'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 group/btn">
          Ver Relatório Detalhado
          <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

const SummaryBar = ({ summary }: { summary: ReturnType<typeof getAnalysisSummary> }) => (
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
    {[
      { label: 'Total Analisado', value: summary.total, icon: <FileText className="w-5 h-5 text-gray-400" />, color: 'gray' },
      { label: 'Sites Bons', value: summary.ok, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: 'emerald' },
      { label: 'Atenção', value: summary.warning, icon: <AlertCircle className="w-5 h-5 text-amber-500" />, color: 'amber' },
      { label: 'Em Erro', value: summary.error, icon: <XCircle className="w-5 h-5 text-rose-500" />, color: 'rose' },
      { label: 'Inseguros', value: summary.ssl, icon: <Shield className="w-5 h-5 text-blue-500" />, color: 'blue' },
      { label: 'Genéricos', value: summary.generic, icon: <Globe className="w-5 h-5 text-purple-500" />, color: 'purple' }
    ].map((stat, i) => (
      <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          {stat.icon}
          <span className={`text-[10px] font-bold uppercase tracking-wider text-${stat.color}-500/70`}>Resultados</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
        <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
      </div>
    ))}
  </div>
);

const FilterSidebar = ({ 
  selectedStatus, 
  setSelectedStatus,
  history,
  onLoadHistory,
  onClearHistory
}: { 
  selectedStatus: string; 
  setSelectedStatus: (s: string) => void;
  history: AnalysisHistoryEntry[];
  onLoadHistory: (entry: AnalysisHistoryEntry) => void;
  onClearHistory: () => void;
}) => (
  <div className="w-full lg:w-72 space-y-6">
    {/* Filtros */}
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-primary-600" />
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Filtros Avançados</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
            Status do Website
          </label>
          <div className="space-y-2">
            {[
              { id: 'all', label: 'Todos os Sites', color: 'gray' },
              { id: 'ok', label: 'Performance Boa', color: 'emerald' },
              { id: 'warning', label: 'Problemas Leves', color: 'amber' },
              { id: 'error', label: 'Sites Fora do Ar', color: 'rose' },
              { id: 'ssl_issue', label: 'Inseguros (SSL)', color: 'blue' },
              { id: 'generic', label: 'Genéricos', color: 'purple' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                  selectedStatus === status.id 
                    ? `bg-${status.color}-50 text-${status.color}-700 border border-${status.color}-100 shadow-sm` 
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {status.label}
                {selectedStatus === status.id && <ChevronRight className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Histórico Recente */}
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Histórico</h2>
        </div>
        {history.length > 0 && (
          <button 
            onClick={onClearHistory}
            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
            title="Limpar Histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-gray-200" />
          </div>
          <p className="text-xs text-gray-400 font-medium px-4">Nenhuma análise anterior registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onLoadHistory(entry)}
              className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-primary-600 uppercase">
                  {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                  {entry.totalCount} sites
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 line-clamp-1 mb-2 group-hover:text-primary-700">
                {entry.location}
              </p>
              
              {/* Mini Summary */}
              <div className="flex gap-1.5">
                {entry.summary.ok > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${entry.summary.ok} bons`} />}
                {entry.summary.warning > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${entry.summary.warning} avisos`} />}
                {entry.summary.error > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title={`${entry.summary.error} erros`} />}
                {entry.summary.ssl_issue > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${entry.summary.ssl_issue} SSL`} />}
                {entry.summary.generic > 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title={`${entry.summary.generic} genéricos`} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function WebsiteAnalysisPage() {
  const [results, setResults] = useState<SiteAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentHistory, setCurrentHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const hasStartedRef = useRef(false);

  // Load results from storage and history on mount
  useEffect(() => {
    const saved = loadAnalysisResults();
    if (saved.length > 0) {
      setResults(saved);
    }
    setCurrentHistory(loadHistory());
  }, []);

  // Handle pending analysis from search page
  const runAnalysis = async (sites: { id: string, businessName: string, website: string }[]) => {
    if (sites.length === 0) return;
    
    setLoading(true);
    // Initial UI state - pending
    const initialResults = sites.map(site => ({
      ...site,
      status: 'pending' as SiteStatus
    }));
    setResults(initialResults);
    saveAnalysisResults(initialResults);

    try {
      // Small delay to show initialization
      await new Promise(resolve => setTimeout(resolve, 500));

      const batchResponse = await axios.post('http://localhost:3002/api/analyze/batch', {
        sites: sites
      });

      const finalResults = batchResponse.data;
      setResults(finalResults);
      saveAnalysisResults(finalResults);
      
      // Save to history automatically after a bulk analysis
      const location = sessionStorage.getItem('last_search_location') || 'Busca Local';
      const categories = sessionStorage.getItem('last_search_categories') || 'Geral';
      const updatedHistory = saveToHistory(finalResults, location, categories);
      setCurrentHistory(updatedHistory);
      
    } catch (error) {
      console.error('Batch analysis failed', error);
      // In case of error, mark remaining pending as error
      setResults(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'error' as SiteStatus } : s));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;

    const pending = sessionStorage.getItem('pending_analysis');
    if (pending) {
        hasStartedRef.current = true;
        sessionStorage.removeItem('pending_analysis');
        try {
            const sites = JSON.parse(pending);
            if (Array.isArray(sites) && sites.length > 0) {
                runAnalysis(sites);
            }
        } catch (e) {
            console.error('Failed to parse pending analysis', e);
        }
    } else {
        // Se não houver análise pendente, tenta carregar o último item do histórico
        const history = loadHistory();
        if (history.length > 0) {
            const lastEntry = history[0];
            setResults(lastEntry.sites);
            saveAnalysisResults(lastEntry.sites);
            hasStartedRef.current = true;
        }
    }
}, []);

  const clearResults = () => {
    if (confirm('Tem certeza que deseja limpar todos os resultados?')) {
      setResults([]);
      setSelectedIds(new Set());
      clearAnalysisResults();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Here we would implement re-analysis of current sites
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleLoadFromHistory = (entry: AnalysisHistoryEntry) => {
    setResults(entry.sites);
    setSelectedStatus('all');
    setSelectedIds(new Set());
    saveAnalysisResults(entry.sites);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    if (confirm('Limpar histórico de análises permanentemente?')) {
      clearHistory();
      setCurrentHistory([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map(r => r.id)));
    }
  };

  const reanalyzeErrors = async () => {
    const errorSites = results.filter(s => s.status === 'error' || s.status === 'ssl_issue');
    if (errorSites.length === 0) return;
    
    setLoading(true);
    try {
      const batchResponse = await axios.post('http://localhost:3002/api/analyze/batch', {
        sites: errorSites.map(({ id, businessName, website }) => ({ id, businessName, website }))
      });
      
      const newResults = results.map(s => {
        const updated = batchResponse.data.find((ur: any) => ur.id === s.id);
        return updated || s;
      });
      
      setResults(newResults);
      saveAnalysisResults(newResults);
    } catch (error) {
      console.error('Re-analysis failed', error);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {
      ok: results.filter(r => r.status === 'ok').length,
      warning: results.filter(r => r.status === 'warning').length,
      error: results.filter(r => r.status === 'error').length,
      ssl_issue: results.filter(r => r.status === 'ssl_issue').length,
      generic: results.filter(r => r.status === 'generic').length
    };
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.businessName.toLowerCase().includes(query) || 
        r.website.toLowerCase().includes(query)
      );
    }

    // Sort: Errors first, then SSL problems, then Warnings, then Ok, then Generics
    const statusOrder: Record<SiteStatus | 'pending', number> = {
      'error': 0,
      'ssl_issue': 1,
      'warning': 2,
      'ok': 3,
      'generic': 4,
      'pending': 5
    };
    
    return [...filtered].sort((a, b) => 
      (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
    );
  }, [results, selectedStatus, searchQuery]);

  const summary = getAnalysisSummary(results);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Análise de Presença Digital</h1>
              <p className="text-xs text-gray-500 font-medium">Auditoria técnica de performance e segurança</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Tool */}
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Filtrar por nome ou URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-80 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

            <button 
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all disabled:opacity-50"
              title="Atualizar Análise"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={clearResults}
              className="p-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Limpar Tudo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-200 flex items-center gap-2 transition-all active:scale-95">
              <Download className="w-4 h-4" />
              Exportar Leads
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar 
            selectedStatus={selectedStatus} 
            setSelectedStatus={setSelectedStatus}
            history={currentHistory}
            onLoadHistory={handleLoadFromHistory}
            onClearHistory={handleClearHistory}
          />

          {/* Main Content */}
          <div className="flex-1">
            <SummaryBar summary={summary} />

            {/* Toolbar Extra */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-4 px-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={selectAll}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary-600 transition-colors uppercase tracking-wider"
                  >
                    {selectedIds.size === filteredResults.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {selectedIds.size === filteredResults.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                      {selectedIds.size} selecionados
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={reanalyzeErrors}
                    disabled={loading || results.filter(s => s.status === 'error' || s.status === 'ssl_issue').length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all border border-rose-100"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Re-analisar Falhas
                  </button>
                </div>
            </div>

            {loading && results.every(r => r.status === 'pending') ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin" />
                  <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Iniciando Varredura Digital...</h2>
                <p className="text-gray-500 text-sm max-w-sm text-center">
                  Estamos rastreando os sites e capturando evidências visuais. Isso pode levar alguns segundos.
                </p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum resultado encontrado</h3>
                <p className="text-gray-500 text-sm">Tente ajustar seus filtros ou realizar uma nova busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredResults.map((analysis) => (
                  <SiteAnalysisCard 
                    key={analysis.id} 
                    analysis={analysis} 
                    isSelected={selectedIds.has(analysis.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
