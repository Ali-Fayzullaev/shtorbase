/**
 * Экранирует символы `%` и `_` в аргументах Postgres ILIKE, чтобы пользователь
 * не мог превратить поиск `abc` в `%` (match всего). Совместимо с Supabase ilike.
 *
 * Дополнительно обрезает управляющие символы и SQL-wildcards бэкслеша.
 */
export function escapeIlike(input: string): string {
  return input
    .replace(/[\\%_]/g, (c) => `\\${c}`)
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
}

/**
 * Защита от CSV Injection (CVE категории — формулы Excel/Sheets).
 * Добавляет апостроф в начало ячейки, если она начинается со спец-символа формулы.
 * https://owasp.org/www-community/attacks/CSV_Injection
 */
export function sanitizeCsvCell(value: string | null | undefined): string {
  const s = String(value ?? '')
  if (s.length === 0) return s
  const first = s.charAt(0)
  if (first === '=' || first === '+' || first === '-' || first === '@' || first === '\t' || first === '\r') {
    return `'${s}`
  }
  return s
}
