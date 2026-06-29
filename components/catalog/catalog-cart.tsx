'use client'

import { useState, useTransition, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, X, Loader2, ShoppingBag, Search, Package } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils/format'
import { formatPhoneInput, isValidPhone } from '@/lib/utils/phone'
import { createQuickOrder } from '@/lib/actions/orders'
import { getClients } from '@/lib/actions/clients'
import type { Client } from '@/lib/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────

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
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

// ── Context ────────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

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
        i.product_id === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalAmount, isOpen, openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

// ── Cart Panel (slide-over) ────────────────────────────────────────────────────

export function CartPanel() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalAmount, isOpen, openCart, closeCart } = useCart()
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientDropdown, setClientDropdown] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && clients.length === 0) getClients().then(setClients)
  }, [isOpen, clients.length])

  const filteredClients = clientSearch.trim()
    ? clients.filter((c) => {
        const q = clientSearch.toLowerCase()
        return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      })
    : clients

  function selectClient(c: Client) {
    setClientId(c.id)
    setClientSearch(c.name)
    setClientDropdown(false)
    if (c.phone && !phone) setPhone(c.phone.replace(/\D/g, '').slice(0, 11))
  }

  function handleSubmit() {
    if (items.length === 0) return
    if (!isValidPhone(phone)) { setError('Укажите полный номер телефона'); return }
    setError(null)
    const orderItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.price }))
    startTransition(async () => {
      const result = await createQuickOrder(orderItems, note || undefined, phone || undefined, clientId || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        clearCart()
        setNote('')
        setPhone('')
        setClientId(null)
        setClientSearch('')
        setTimeout(() => { setSuccess(false); closeCart() }, 2000)
      }
    })
  }

  return (
    <>
      {/* Desktop FAB — hidden on mobile (cart is in BottomNav there) */}
      <button
        onClick={openCart}
        aria-label="Открыть корзину"
        className={cn(
          'hidden lg:flex fixed bottom-8 right-8 z-40 h-[3.5rem] items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95',
          totalItems > 0
            ? 'min-w-[3.5rem] gap-3 px-5 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40'
            : 'w-[3.5rem] bg-zinc-700 hover:bg-zinc-600 shadow-zinc-700/30'
        )}
      >
        <div className="relative">
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-indigo-600 tabular-nums">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        {totalItems > 0 && (
          <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">
            {formatPrice(totalAmount)} ₸
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <ShoppingBag size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Корзина</h2>
              {totalItems > 0 && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{totalItems} поз. · {formatPrice(totalAmount)} ₸</p>
              )}
            </div>
          </div>
          <button
            onClick={closeCart}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {success && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              Заказ успешно оформлен!
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {items.length === 0 && !success && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/60">
                <Package size={28} className="text-zinc-400" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300">Корзина пуста</p>
              <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Добавьте товары из каталога</p>
              <button
                onClick={closeCart}
                className="mt-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Перейти в каталог
              </button>
            </div>
          )}

          {items.map((item) => (
            <div key={item.product_id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
              <div className="flex items-start gap-3 mb-3">
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt={item.name} className="h-14 w-14 rounded-lg object-cover shrink-0 bg-zinc-100" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{item.sku}</p>
                </div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="shrink-0 rounded-lg p-1.5 text-zinc-300 dark:text-zinc-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {item.quantity <= 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, Number(e.target.value) || 1)}
                    className="h-8 w-14 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                  <span className="text-[11px] text-zinc-400 ml-0.5">{item.unit === 'meter' ? 'м' : 'шт'}</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatPrice(item.quantity * item.price)} <span className="text-zinc-400 font-medium">₸</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: order form */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-4 space-y-3 bg-zinc-50/80 dark:bg-zinc-900/60">
            {/* Client search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Клиент (имя или телефон)"
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setClientDropdown(true); if (!e.target.value) setClientId(null) }}
                onFocus={() => setClientDropdown(true)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2.5 text-[13px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              {clientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
                  {filteredClients.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 text-[13px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                        clientId === c.id && 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700'
                      )}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone && <span className="text-zinc-400 ml-2 text-[12px]">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                placeholder="Телефон клиента *"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                required
                className={cn(
                  'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-[13px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
                  phone && !isValidPhone(phone) && 'border-amber-400 focus:ring-amber-400/20'
                )}
              />
              {phone && !isValidPhone(phone) && (
                <p className="mt-1 text-[11px] text-amber-600">Введите 11 цифр, например: 87771234567</p>
              )}
            </div>

            {/* Note */}
            <textarea
              placeholder="Примечание к заказу..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-[13px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            />

            {/* Total + clear */}
            <div className="flex items-center justify-between">
              <button
                onClick={clearCart}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                Очистить корзину
              </button>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400">Итого</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight">
                  {formatPrice(totalAmount)} <span className="text-sm text-zinc-400 font-medium">₸</span>
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {isPending ? (
                <><Loader2 size={16} className="animate-spin" />Оформление...</>
              ) : (
                <><ShoppingBag size={16} />Оформить заказ</>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
