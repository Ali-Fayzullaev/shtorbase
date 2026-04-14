import { type ProductUnit } from '@/lib/types/database'

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

  return `${formatted} ${unit === 'meter' ? 'м' : 'шт'}`
}

export function unitLabel(unit: ProductUnit): string {
  return unit === 'meter' ? 'за метр' : 'за штуку'
}

export function unitLabelShort(unit: ProductUnit): string {
  return unit === 'meter' ? 'МЕТР' : 'ШТУКА'
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
