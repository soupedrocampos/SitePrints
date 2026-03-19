/**
 * Helper para identificar o país a partir da string de localização 
 * e retornar a bandeira apropriada.
 */
export function getFlagFromLocation(location: string): string {
    if (!location) return ''
    const lowerLoc = location.toLowerCase()

    if (lowerLoc.includes('brazil') || lowerLoc.includes('brasil')) return '🇧🇷'
    if (lowerLoc.includes('usa') || lowerLoc.includes('united states') || lowerLoc.includes('estados unidos')) return '🇺🇸'
    if (lowerLoc.includes('portugal')) return '🇵🇹'
    if (lowerLoc.includes('spain') || lowerLoc.includes('espanha')) return '🇪🇸'
    if (lowerLoc.includes('argentina')) return '🇦🇷'
    if (lowerLoc.includes('chile')) return '🇨🇱'
    if (lowerLoc.includes('mexico') || lowerLoc.includes('méxico')) return '🇲🇽'
    if (/\buk\b/.test(lowerLoc) || lowerLoc.includes('united kingdom') || lowerLoc.includes('reino unido') || lowerLoc.includes('london')) return '🇬🇧'
    if (lowerLoc.includes('canada') || lowerLoc.includes('canadá')) return '🇨🇦'
    if (lowerLoc.includes('france') || lowerLoc.includes('frança')) return '🇫🇷'
    if (lowerLoc.includes('italy') || lowerLoc.includes('itália')) return '🇮🇹'
    if (lowerLoc.includes('germany') || lowerLoc.includes('alemanha')) return '🇩🇪'
    if (lowerLoc.includes('japan') || lowerLoc.includes('japão')) return '🇯🇵'
    
    // Retorna vazio se não identificar
    return ''
}

/**
 * Retorna a localização com a bandeira prefixada.
 */
export function formatLocationWithFlag(location: string): string {
    if (!location) return ''
    const flag = getFlagFromLocation(location)
    if (flag && !location.startsWith(flag)) {
        return `${flag} ${location}`
    }
    return location
}
