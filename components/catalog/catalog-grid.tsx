'use client'

import { type Product } from '@/lib/types/database'
import { formatPrice, formatStock, unitLabel, cn } from '@/lib/utils/format'
import { useCart } from '@/components/catalog/catalog-cart'
import { ShoppingCart, Plus, Check, ImageIcon, AlertTriangle } from 'lucide-react'
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
        <div className="rounded-full bg-slate-100 p-5 mb-4">
          <ShoppingCart size={28} className="text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-600">Товары не найдены</p>
        <p className="text-sm text-slate-400 mt-1">Попробуйте изменить фильтры или поиск</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <CatalogCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function CatalogCard({ product }: { product: ProductWithThumb }) {
  const { addItem, items } = useCart()
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
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300">
      {/* Image / placeholder */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={40} className="text-slate-300" />
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
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {product.category.name}
            </span>
          )}
          <span className="font-mono text-[11px] text-slate-400">{product.sku}</span>
        </div>

        {/* Name */}
        <Link
          href={`/catalog/${product.id}`}
          className="text-[15px] font-semibold text-slate-800 leading-snug hover:text-indigo-600 transition-colors line-clamp-2 mb-auto"
        >
          {product.name}
        </Link>

        {/* Price + Stock row */}
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xl font-bold text-slate-800 tabular-nums">
              {formatPrice(product.price)} <span className="text-sm font-semibold text-slate-400">₸</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {unitLabel(product.unit)} · {product.vat_included ? 'НДС' : 'без НДС'}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                isOut && 'text-red-500',
                isLow && 'text-amber-600',
                !isOut && !isLow && 'text-slate-700'
              )}
            >
              {isOut ? '0' : formatStock(product.stock, product.unit)}
            </p>
            <p className="text-[11px] text-slate-400">в наличии</p>
          </div>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={isOut}
          className={cn(
            'mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]',
            isOut
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : justAdded
                ? 'bg-emerald-500 text-white'
                : inCart
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          )}
        >
          {justAdded ? (
            <>
              <Check size={16} />
              Добавлено!
            </>
          ) : inCart ? (
            <>
              <Plus size={16} />
              Ещё ({inCart.quantity})
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              В корзину
            </>
          )}
        </button>
      </div>
    </div>
  )
}
