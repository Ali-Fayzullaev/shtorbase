import { type ProductUnit } from '@/lib/types/database'

/** Нормализует legacy-значения 'meter'/'piece' к коротким обозначениям */
function normalizeUnit(unit: ProductUnit): string {
  if (unit === 'meter') return 'м'
  if (unit === 'piece') return 'шт'
  return unit
}

export { normalizeUnit }

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatStock(stock: number, unit: ProductUnit): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(stock)

  return `${formatted} ${normalizeUnit(unit)}`
}

export function unitLabel(unit: ProductUnit): string {
  return `за ${normalizeUnit(unit)}`
}

export function unitLabelShort(unit: ProductUnit): string {
  return normalizeUnit(unit).toUpperCase()
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  }).format(new Date(date))
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
