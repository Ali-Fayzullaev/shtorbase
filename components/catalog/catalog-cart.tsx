'use client'

import { useState, useTransition, createContext, useContext, useCallback, type ReactNode } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, X, Loader2, ShoppingBag } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils/format'
import { formatPhoneInput, isValidPhone } from '@/lib/utils/phone'
import { createQuickOrder } from '@/lib/actions/orders'

// ============================================
// Cart context + provider
// ============================================
export interface CartItem {
  product_id: string
  name: string
  sku: string
  unit: string
  price: number
  stock: number
  quantity: number
  thumbnail?: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
            : i
        )
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}

// ============================================
// Floating cart button + slide-over panel
// ============================================
export function CartPanel() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalAmount } = useCart()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit() {
    if (items.length === 0) return
    if (!isValidPhone(phone)) {
      setError('Укажите полный номер телефона')
      return
    }
    setError(null)

    const orderItems = items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price,
    }))

    startTransition(async () => {
      const result = await createQuickOrder(orderItems, note || undefined, phone || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        clearCart()
        setNote('')
        setPhone('')
        setTimeout(() => {
          setSuccess(false)
          setOpen(false)
        }, 2000)
      }
    })
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 font-medium text-white shadow-xl transition-all hover:scale-105 active:scale-95',
          totalItems > 0
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : 'bg-slate-400 hover:bg-slate-500'
        )}
      >
        <ShoppingCart size={20} />
        {totalItems > 0 && (
          <>
            <span className="text-sm">{totalItems}</span>
            <span className="h-4 w-px bg-white/30" />
            <span className="text-sm">{formatPrice(totalAmount)} ₸</span>
          </>
        )}
        {totalItems === 0 && <span className="text-sm">Корзина</span>}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Корзина</h2>
            {totalItems > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
              Заказ успешно создан!
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {items.length === 0 && !success && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4 mb-3">
                <ShoppingCart size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Корзина пуста</p>
              <p className="text-xs text-slate-400 mt-1">Добавьте товары из каталога</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.sku}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, Number(e.target.value) || 1)}
                      className="h-8 w-16 rounded-lg border border-slate-200 text-center text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-slate-400 ml-1">
                      {item.unit === 'meter' ? 'м' : 'шт'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 tabular-nums">
                    {formatPrice(item.quantity * item.price)} ₸
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            <textarea
              placeholder="Примечание к заказу..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
            />

            <div className="space-y-1">
              <input
                type="tel"
                placeholder="87771234567 *"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                required
                className={cn(
                  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300',
                  phone && !isValidPhone(phone) && 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/20'
                )}
              />
              {phone && !isValidPhone(phone) && (
                <p className="text-[11px] text-amber-600">Введите 11 цифр, например: 87771234567</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Очистить
              </button>
              <p className="text-lg font-bold text-slate-800 tabular-nums">
                {formatPrice(totalAmount)} <span className="text-sm text-slate-400">₸</span>
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Оформление...
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Оформить заказ
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
