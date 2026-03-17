/**
 * cnpjValidator.ts — Official CNPJ validation algorithm (digit verification).
 * Extracted here so it can be shared between CNPJInput component and services.
 */

export function stripCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '')
}

/**
 * Validates CNPJ using the Brazilian verification-digit algorithm.
 * Accepts both masked (XX.XXX.XXX/XXXX-XX) and raw (14 digits) formats.
 */
export function validateCNPJ(cnpj: string): boolean {
    const digits = stripCNPJ(cnpj)

    if (digits.length !== 14) return false
    // Reject all-same-digit CNPJs (e.g. 00000000000000)
    if (/^(\d)\1+$/.test(digits)) return false

    const calcDigit = (base: string, length: number): number => {
        let sum = 0
        let pos = length - 7
        for (let i = length; i >= 1; i--) {
            sum += parseInt(base.charAt(length - i)) * pos--
            if (pos < 2) pos = 9
        }
        const r = sum % 11
        return r < 2 ? 0 : 11 - r
    }

    const d1 = calcDigit(digits, 12)
    if (d1 !== parseInt(digits.charAt(12))) return false

    const d2 = calcDigit(digits, 13)
    return d2 === parseInt(digits.charAt(13))
}

export function maskCNPJ(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 14)
    return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
}

export type CNPJValidationResult =
    | { valid: true; digits: string; masked: string }
    | { valid: false; error: string }

export function parseCNPJ(input: string): CNPJValidationResult {
    const digits = stripCNPJ(input)
    if (digits.length !== 14) return { valid: false, error: 'CNPJ deve ter 14 dígitos' }
    if (!validateCNPJ(digits)) return { valid: false, error: 'CNPJ inválido — dígitos verificadores incorretos' }
    return { valid: true, digits, masked: maskCNPJ(digits) }
}
