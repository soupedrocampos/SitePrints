export interface SearchHistoryEntry {
    id: string
    query: string
    location: string
    radius: number
    resultsCount: number
    sessionId: string
    types: string[]
    createdAt: string
}

export function saveSearchToHistory(entry: Omit<SearchHistoryEntry, 'id' | 'createdAt'>) {
    const history: SearchHistoryEntry[] = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const newEntry: SearchHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    }
    history.unshift(newEntry)
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 50)))
}

export function getSearchHistory(): SearchHistoryEntry[] {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]')
}

export function clearSearchHistory() {
    localStorage.removeItem('searchHistory')
}
