/**
 * Определяет CSS-цвет по русскому названию (для кружка-свотча у вариаций
 * товара и позиций заказа). Сопоставление по вхождению основы слова —
 * так «тёмно-синий», «синяя», «синие» и т.д. находят один и тот же цвет
 * без необходимости перечислять все словоформы.
 */
const COLOR_STEMS: [stem: string, hex: string][] = [
  ['бел', '#ffffff'],
  ['черн', '#18181b'],
  ['красн', '#ef4444'],
  ['бордов', '#7f1d1d'],
  ['малинов', '#d6336c'],
  ['розов', '#f472b6'],
  ['пудров', '#f3d9d9'],
  ['оранж', '#f97316'],
  ['терракот', '#cc5b3f'],
  ['перси', '#ffcba4'],
  ['желт', '#eab308'],
  ['лимон', '#fef08a'],
  ['золот', '#d4af37'],
  ['беж', '#d4c5a9'],
  ['крем', '#fefce8'],
  ['песочн', '#e0c9a6'],
  ['зелен', '#22c55e'],
  ['изумрудн', '#10b981'],
  ['мятн', '#6ee7b7'],
  ['хаки', '#78716c'],
  ['оливков', '#808000'],
  ['бирюзов', '#2dd4bf'],
  ['голуб', '#7dd3fc'],
  ['син', '#3b82f6'],
  ['индиго', '#4338ca'],
  ['фиолетов', '#a855f7'],
  ['сирен', '#c4b5fd'],
  ['лавандов', '#d8b4fe'],
  ['коричнев', '#92400e'],
  ['шоколад', '#6b3410'],
  ['серебр', '#c0c0c0'],
  ['графит', '#4b5563'],
  ['пепельн', '#d1d5db'],
  ['сер', '#9ca3af'],
]

export function resolveColorSwatch(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  for (const [stem, hex] of COLOR_STEMS) {
    if (normalized.includes(stem)) return hex
  }
  return null
}

/** Похоже ли название параметра/поля на «цвет» — чтобы решить, стоит ли вообще пробовать свотч */
export function isColorFieldName(name: string | null | undefined): boolean {
  if (!name) return false
  return name.trim().toLowerCase().includes('цвет')
}

/**
 * Цвет позиции заказа — сначала ищем среди её custom_attributes (ручной
 * ввод при оформлении), затем пробуем название товара (цвет часто зашит
 * прямо в название после массового создания вариаций, напр. «... — белый»).
 */
export function resolveItemColorSwatch(
  customAttributes: Record<string, string> | null | undefined,
  productName: string | null | undefined
): string | null {
  for (const v of Object.values(customAttributes ?? {})) {
    const hex = resolveColorSwatch(v)
    if (hex) return hex
  }
  return resolveColorSwatch(productName)
}
