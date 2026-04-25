'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, formatStock, unitLabel, normalizeUnit, cn } from '@/lib/utils/format'
import { useCart } from '@/components/catalog/catalog-cart'
import { ShoppingCart, Plus, Minus, Check, ImageIcon, AlertTriangle, Trash2, LayoutGrid, Rows3, PanelsTopLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface ProductWithThumb extends Product {
  thumbnail?: string | null
  images?: string[]
}

type CatalogDensity = 'compact' | 'comfortable' | 'showcase'

interface CatalogGridProps {
  products: ProductWithThumb[]
  total?: number
}

const densityOptions: Array<{ value: CatalogDensity; label: string; short: string; icon: typeof Rows3 }> = [
  { value: 'compact', label: 'Компактно', short: 'S', icon: Rows3 },
  { value: 'comfortable', label: 'Стандарт', short: 'M', icon: LayoutGrid },
  { value: 'showcase', label: 'Крупно', short: 'L', icon: PanelsTopLeft },
]

export function CatalogGrid({ products, total }: CatalogGridProps) {
  const [density, setDensity] = useState<CatalogDensity>('comfortable')

  useEffect(() => {
    const saved = localStorage.getItem('catalog-density') as CatalogDensity | null
    if (saved === 'compact' || saved === 'comfortable' || saved === 'showcase') {
      setDensity(saved)
    }
  }, [])

  function handleDensityChange(nextDensity: CatalogDensity) {
    setDensity(nextDensity)
    localStorage.setItem('catalog-density', nextDensity)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-5 mb-4">
          <ShoppingCart size={28} className="text-zinc-400" />
        </div>
        <p className="text-base font-semibold text-zinc-600 dark:text-zinc-300">Товары не найдены</p>
        <p className="text-sm text-zinc-400 mt-1">Попробуйте изменить фильтры или поиск</p>
      </div>
    )
  }

  const gridClassName = cn(
    'grid gap-5 stagger-children',
    density === 'compact' && 'grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4',
    density === 'comfortable' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    density === 'showcase' && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-zinc-950/75 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Каталог
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {total ?? products.length} товаров
            </span>
            <span className="text-[12px] text-zinc-400 dark:text-zinc-500">
              Сейчас показано {products.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Размер карточек
          </span>
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
            {densityOptions.map((option) => {
              const Icon = option.icon
              const active = density === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleDensityChange(option.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all',
                    active
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  )}
                  aria-pressed={active}
                  title={option.label}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.short}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={gridClassName}>
      {products.map((product) => (
        <CatalogCard key={product.id} product={product} density={density} />
      ))}
      </div>
    </div>
  )
}

function CatalogCard({ product, density }: { product: ProductWithThumb; density: CatalogDensity }) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const isLow = product.stock < 10 && product.stock > 0
  const isOut = product.stock === 0
  const inCart = items.find((i) => i.product_id === product.id)
  const isCompact = density === 'compact'
  const isShowcase = density === 'showcase'

  function handleAdd() {
    if (isOut) return
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      thumbnail: product.thumbnail,
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl glass-card transition-transform duration-300 hover:-translate-y-1',
        isCompact && 'rounded-xl',
        isShowcase && 'rounded-[1.35rem]'
      )}
    >
      {/* Image / placeholder with hover gallery */}
      <ProductImage product={product} density={density} />

      {/* Content */}
      <div className={cn('flex flex-1 flex-col', isCompact ? 'p-3.5' : isShowcase ? 'p-5' : 'p-4')}>
        {/* Category + SKU */}
        <div className={cn('flex items-center gap-2', isCompact ? 'mb-1.5 flex-wrap' : 'mb-2')}>
          {product.category && (
            <span className={cn(
              'rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
              isCompact ? 'text-[10px]' : 'text-[11px]'
            )}>
              {product.category.name}
            </span>
          )}
          <span className={cn('font-mono text-zinc-400', isCompact ? 'text-[10px]' : 'text-[11px]')}>{product.sku}</span>
        </div>

        {/* Name */}
        <Link
          href={`/catalog/${product.id}`}
          className={cn(
            'mb-auto font-semibold leading-snug text-zinc-800 transition-colors hover:text-indigo-600 dark:text-zinc-200',
            isCompact ? 'line-clamp-2 text-[14px]' : isShowcase ? 'line-clamp-3 text-[17px]' : 'line-clamp-2 text-[15px]'
          )}
        >
          {product.name}
        </Link>

        {/* Price + Stock row */}
        <div className={cn('mt-3 flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800', isCompact && 'mt-2.5 pt-2.5')}>
          <div>
            <div className={cn(
              'inline-flex items-baseline gap-1 rounded-lg border border-white/30 bg-white/40 px-2.5 py-1 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.06]',
              isCompact && 'px-2 py-0.5',
              isShowcase && 'px-3 py-1.5'
            )}>
              <span className={cn('font-bold tabular-nums text-indigo-700 dark:text-indigo-300', isCompact ? 'text-base' : isShowcase ? 'text-xl' : 'text-lg')}>{formatPrice(product.price)}</span>
              <span className="text-xs font-semibold text-indigo-400">₸</span>
            </div>
            <p className={cn('mt-1 text-zinc-400', isCompact ? 'text-[10px]' : 'text-[11px]')}>
              {unitLabel(product.unit)} · {product.vat_included ? 'НДС' : 'без НДС'}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'font-bold tabular-nums',
                isCompact ? 'text-[13px]' : 'text-sm',
                isOut && 'text-red-500',
                isLow && 'text-amber-600',
                !isOut && !isLow && 'text-zinc-700 dark:text-zinc-300'
              )}
            >
              {isOut ? '0' : formatStock(product.stock, product.unit)}
            </p>
            <p className={cn('text-zinc-400', isCompact ? 'text-[10px]' : 'text-[11px]')}>в наличии</p>
          </div>
        </div>

        {/* Add to cart / quantity controls */}
        {inCart && !justAdded ? (
          <div className={cn('mt-3 flex items-center gap-1.5', isCompact && 'gap-1')}>
            <button
              onClick={() => {
                if (inCart.quantity <= 1) removeItem(product.id)
                else updateQuantity(product.id, inCart.quantity - 1)
              }}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
                isCompact ? 'h-8 w-8' : 'h-9 w-9'
              )}
            >
              {inCart.quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
            </button>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={inCart.quantity}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (v > 0) updateQuantity(product.id, Math.min(v, product.stock))
              }}
              className={cn(
                'flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white text-center font-semibold text-zinc-800 tabular-nums focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [appearance:textfield] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                isCompact ? 'h-8 text-[13px]' : 'h-9 text-sm'
              )}
            />
            <button
              onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
              disabled={inCart.quantity >= product.stock}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
                isCompact ? 'h-8 w-8' : 'h-9 w-9'
              )}
            >
              <Plus size={14} />
            </button>
            <span className={cn('shrink-0 text-zinc-400', isCompact ? 'text-[10px]' : 'text-[11px]')}>
              {normalizeUnit(product.unit)}
            </span>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={isOut}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 font-semibold transition-all duration-200 active:scale-[0.97]',
              isCompact ? 'py-2 text-[13px]' : isShowcase ? 'py-3 text-sm' : 'py-2.5 text-sm',
              isOut
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : justAdded
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 shadow-sm'
            )}
          >
            {justAdded ? (
              <>
                <Check size={16} />
                Добавлено!
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                В корзину
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Product image with hover gallery
// ============================================
function ProductImage({ product, density }: { product: ProductWithThumb; density: CatalogDensity }) {
  const images = product.images && product.images.length > 0
    ? product.images
    : product.thumbnail ? [product.thumbnail] : []
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const isLow = product.stock < 10 && product.stock > 0
  const isOut = product.stock === 0

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (images.length < 2) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const idx = Math.min(images.length - 1, Math.max(0, Math.floor((x / rect.width) * images.length)))
    if (idx !== active) setActive(idx)
  }

  function onMouseLeave() {
    setActive(0)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900',
        density === 'compact' && 'aspect-[4/3]',
        density === 'comfortable' && 'aspect-[4/3]',
        density === 'showcase' && 'aspect-[5/4]'
      )}
    >
      {images.length > 0 ? (
        <>
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={product.name}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                i === active ? 'opacity-100' : 'opacity-0'
              )}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}

          {/* Hover segments dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    i === active ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/60'
                  )}
                />
              ))}
            </div>
          )}

          {/* Image count badge */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {active + 1}/{images.length}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon size={40} className="text-zinc-300 dark:text-zinc-600" />
        </div>
      )}

      {/* Stock badge */}
      {isOut && (
        <div className="absolute top-3 left-3 rounded-lg bg-red-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          Нет в наличии
        </div>
      )}
      {isLow && (
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <AlertTriangle size={12} />
          Заканчивается
        </div>
      )}

      {/* Unit badge */}
      <div
        className="absolute top-3 right-3 rounded-lg bg-zinc-900/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
      >
        {normalizeUnit(product.unit)}
      </div>
    </div>
  )
}
