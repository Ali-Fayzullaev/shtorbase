'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { type Product } from '@/lib/types/database'
import { updateProductQuickFields, bulkDeleteProducts } from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils/format'
import { toast } from '@/lib/utils/toast'
import { AlertTriangle, ImageIcon, Pencil, Check, Loader2, Trash2 } from 'lucide-react'
import { DeleteProductButton } from './delete-product-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ProductWithThumb extends Product {
  thumbnail?: string | null
}

interface ProductsManagementTableProps {
  products: ProductWithThumb[]
}

const inlineInputCls =
  'h-8 w-24 rounded-lg border border-transparent bg-transparent px-2 text-right text-[13px] font-semibold tabular-nums text-slate-800 dark:text-zinc-200 transition-colors hover:border-slate-200 dark:hover:border-zinc-700 focus:border-indigo-300 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function ProductsManagementTable({ products }: ProductsManagementTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkPending, startBulkTransition] = useTransition()

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-slate-100 dark:bg-zinc-800 p-4 mb-4">
          <AlertTriangle size={24} className="text-slate-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">Товары не найдены</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Попробуйте изменить фильтры</p>
      </div>
    )
  }

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id))

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)))
  }

  function handleBulkDelete() {
    startBulkTransition(async () => {
      const result = await bulkDeleteProducts([...selected])
      setConfirmBulkDelete(false)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Снято с продажи: ${selected.size}`)
        setSelected(new Set())
      }
    })
  }

  return (
    <div className="space-y-2">
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/30 dark:bg-indigo-500/10 px-4 py-2.5">
          <span className="text-[13px] font-medium text-indigo-700 dark:text-indigo-300">Выбрано: {selected.size}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[12px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              Отменить выбор
            </button>
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-500 transition-colors"
            >
              <Trash2 size={13} />
              Удалить выбранные
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-300 dark:border-zinc-600 text-indigo-600 accent-indigo-600"
                />
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Товар</th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Категория</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Цена</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Остаток</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <ProductRow
                key={product.id}
                product={product}
                isLast={idx === products.length - 1}
                selected={selected.has(product.id)}
                onToggle={() => toggleOne(product.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmBulkDelete}
        tone="danger"
        title={`Снять с продажи ${selected.size} товаров?`}
        description="Товары останутся в базе (soft delete) и будут скрыты из каталога."
        confirmLabel="Да, снять"
        loading={bulkPending}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  )
}

function ProductRow({
  product,
  isLast,
  selected,
  onToggle,
}: {
  product: ProductWithThumb
  isLast: boolean
  selected: boolean
  onToggle: () => void
}) {
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [pending, startTransition] = useTransition()
  const [savedField, setSavedField] = useState<'price' | 'stock' | null>(null)
  const [error, setError] = useState('')

  const isLow = product.stock < 10 && product.stock > 0
  const isOut = product.stock === 0

  function flashSaved(field: 'price' | 'stock') {
    setSavedField(field)
    setTimeout(() => setSavedField(null), 1200)
  }

  function savePrice() {
    const value = parseFloat(price)
    if (!(value > 0) || value === product.price) {
      setPrice(String(product.price))
      return
    }
    setError('')
    startTransition(async () => {
      const result = await updateProductQuickFields(product.id, { price: value })
      if (result.error) { setError(result.error); setPrice(String(product.price)) }
      else flashSaved('price')
    })
  }

  function saveStock() {
    const value = parseFloat(stock)
    if (!(value >= 0) || value === product.stock) {
      setStock(String(product.stock))
      return
    }
    setError('')
    startTransition(async () => {
      const result = await updateProductQuickFields(product.id, { stock: value })
      if (result.error) { setError(result.error); setStock(String(product.stock)) }
      else flashSaved('stock')
    })
  }

  return (
    <tr className={cn('group transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/80', selected && 'bg-indigo-50/60 dark:bg-indigo-500/10', !isLast && 'border-b border-slate-100/80 dark:border-zinc-800/80')}>
      {/* Чекбокс */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 dark:border-zinc-600 text-indigo-600 accent-indigo-600"
        />
      </td>

      {/* Товар */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          {product.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnail}
              alt={product.name}
              className="mt-0.5 h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/60 dark:ring-zinc-700/60"
            />
          ) : (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
              <ImageIcon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-200 leading-tight">{product.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">{product.sku}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Категория */}
      <td className="hidden sm:table-cell px-4 py-3">
        <span className="inline-block rounded-md bg-slate-50 dark:bg-zinc-800/50 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400 ring-1 ring-slate-200/60 dark:ring-zinc-700/60">
          {product.category?.name}
        </span>
      </td>

      {/* Цена — инлайн-редактирование */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {savedField === 'price' && <Check size={13} className="text-emerald-500" />}
          {pending && <Loader2 size={12} className="animate-spin text-slate-400" />}
          <input
            type="number"
            min={0}
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={savePrice}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className={inlineInputCls}
          />
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">₸</span>
        </div>
      </td>

      {/* Остаток — инлайн-редактирование */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {isLow && <AlertTriangle size={12} className="text-amber-500" />}
          {savedField === 'stock' && <Check size={13} className="text-emerald-500" />}
          <input
            type="number"
            min={0}
            step="0.1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={saveStock}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className={cn(inlineInputCls, isOut && 'text-red-500', isLow && 'text-amber-600')}
          />
        </div>
        {error && <p className="text-right text-[10px] text-red-500 mt-0.5">{error}</p>}
      </td>

      {/* Действия */}
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/catalog/${product.id}/edit`}
            title="Редактировать"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 text-slate-500 dark:text-zinc-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Pencil size={14} />
          </Link>
          <DeleteProductButton productId={product.id} productName={product.name} compact />
        </div>
      </td>
    </tr>
  )
}
