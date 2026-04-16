/**
 * Allow only digits, max 11 characters
 */
export function formatPhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/**
 * Check if phone has exactly 11 digits
 */
export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length === 11
}

/**
 * Extract the raw digits from a formatted phone, e.g. "+7 (777) 123-45-67" → "77771234567"
 */
export function phoneToDigits(value: string): string {
  return value.replace(/\D/g, '')
}
