'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, formatStock, unitLabel, cn } from '@/lib/utils/format'
import { useCart } from '@/components/catalog/catalog-cart'
import { ShoppingCart, Plus, Minus, Check, ImageIcon, AlertTriangle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface ProductWithThumb extends Product {
  thumbnail?: string | null
}

interface CatalogGridProps {
  products: ProductWithThumb[]
}

export function CatalogGrid({ products }: CatalogGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-zinc-100 p-5 mb-4">
          <ShoppingCart size={28} className="text-zinc-400" />
        </div>
        <p className="text-base font-semibold text-zinc-600">Товары не найдены</p>
        <p className="text-sm text-zinc-400 mt-1">Попробуйте изменить фильтры или поиск</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
      {products.map((product) => (
        <CatalogCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function CatalogCard({ product }: { product: ProductWithThumb }) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const isLow = product.stock < 10 && product.stock > 0
  const isOut = product.stock === 0
  const inCart = items.find((i) => i.product_id === product.id)

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
    <div className="group relative flex flex-col rounded-2xl glass-card overflow-hidden hover:-translate-y-1">
      {/* Image / placeholder */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-50 to-zinc-100 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={40} className="text-zinc-200" />
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
          className={cn(
            'absolute top-3 right-3 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm',
            product.unit === 'meter'
              ? 'bg-blue-500/90 text-white'
              : 'bg-emerald-500/90 text-white'
          )}
        >
          {product.unit === 'meter' ? 'Метр' : 'Штука'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category + SKU */}
        <div className="flex items-center gap-2 mb-2">
          {product.category && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {product.category.name}
            </span>
          )}
          <span className="font-mono text-[11px] text-zinc-400">{product.sku}</span>
        </div>

        {/* Name */}
        <Link
          href={`/catalog/${product.id}`}
          className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug hover:text-indigo-600 transition-colors line-clamp-2 mb-auto"
        >
          {product.name}
        </Link>

        {/* Price + Stock row */}
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-zinc-100">
          <div>
            <div className="inline-flex items-baseline gap-1 rounded-lg bg-white/40 dark:bg-white/[0.06] backdrop-blur-sm border border-white/30 dark:border-white/[0.06] px-2.5 py-1">
              <span className="text-lg font-bold text-indigo-700 tabular-nums">{formatPrice(product.price)}</span>
              <span className="text-xs font-semibold text-indigo-400">₸</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {unitLabel(product.unit)} · {product.vat_included ? 'НДС' : 'без НДС'}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-sm font-bold tabular-nums',
                isOut && 'text-red-500',
                isLow && 'text-amber-600',
                !isOut && !isLow && 'text-zinc-700'
              )}
            >
              {isOut ? '0' : formatStock(product.stock, product.unit)}
            </p>
            <p className="text-[11px] text-zinc-400">в наличии</p>
          </div>
        </div>

        {/* Add to cart / quantity controls */}
        {inCart && !justAdded ? (
          <div className="mt-3 flex items-center gap-1.5">
            <button
              onClick={() => {
                if (inCart.quantity <= 1) removeItem(product.id)
                else updateQuantity(product.id, inCart.quantity - 1)
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
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
              className="h-9 flex-1 min-w-0 rounded-lg border border-zinc-200 text-center text-sm font-semibold text-zinc-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
              disabled={inCart.quantity >= product.stock}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
            <span className="text-[11px] text-zinc-400 shrink-0">
              {product.unit === 'meter' ? 'м' : 'шт'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={isOut}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97]',
              isOut
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
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
