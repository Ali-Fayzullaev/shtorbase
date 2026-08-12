import { resolveColorSwatch } from '@/lib/utils/color'
import { cn } from '@/lib/utils/format'

interface ColorSwatchProps {
  value: string | null | undefined
  size?: number
  className?: string
}

/** Цветной кружок по названию цвета («Красный» → красный кружок). Ничего не рендерит, если цвет не распознан. */
export function ColorSwatch({ value, size = 12, className }: ColorSwatchProps) {
  const hex = resolveColorSwatch(value)
  if (!hex) return null

  return (
    <span
      className={cn('inline-block shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15', className)}
      style={{ width: size, height: size, backgroundColor: hex }}
      title={value ?? undefined}
    />
  )
}
