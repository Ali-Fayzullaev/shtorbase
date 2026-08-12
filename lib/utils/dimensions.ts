/**
 * Индивидуальные размеры позиции заказа (ширина/высота карниза, шторы и т.д.)
 * хранятся как обычные пары параметр/значение в order_items.custom_attributes —
 * то же самое поле, что и цвет, тип механизма и т.д. Эти хелперы вытаскивают
 * оттуда именно ширину/высоту по названию параметра, чтобы показать диаграмму
 * размеров (см. components/orders/dimensions-diagram.tsx), независимо от того,
 * заведено ли значение через специальные поля в форме заказа или вручную как
 * произвольный параметр.
 */

const WIDTH_STEMS = ['шир', 'width']
const HEIGHT_STEMS = ['выс', 'длин', 'height', 'length']

export const DIMENSION_WIDTH_KEY = 'Ширина'
export const DIMENSION_HEIGHT_KEY = 'Высота'

export interface ExtractedDimensions {
  width: string | null
  height: string | null
}

export function extractDimensions(attrs: Record<string, string> | null | undefined): ExtractedDimensions {
  let width: string | null = null
  let height: string | null = null
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (!value?.trim()) continue
      const normalized = key.trim().toLowerCase()
      if (!width && WIDTH_STEMS.some((s) => normalized.includes(s))) width = value
      if (!height && HEIGHT_STEMS.some((s) => normalized.includes(s))) height = value
    }
  }
  return { width, height }
}

export function hasDimensions(attrs: Record<string, string> | null | undefined): boolean {
  const { width, height } = extractDimensions(attrs)
  return Boolean(width || height)
}
