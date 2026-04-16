'use client'

import { useActionState, useState, useTransition } from 'react'
import { createOrderAction, type OrderFormState } from '@/lib/actions/orders'
import { createNewClient as createClientAction } from '@/lib/actions/clients'
import { type Client, type Product, type UserRole } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { formatPhoneInput, isValidPhone } from '@/lib/utils/phone'
import { Plus, Trash2, Search, Loader2, UserPlus, Package } from 'lucide-react'

const inputCls =
  'flex h-9 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'
const labelCls = 'text-sm font-medium text-slate-700'
const selectCls =
  'flex h-9 w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50'

interface OrderItem {
  product_id: string
  product_name: string
  product_sku: string
  product_unit: string
  quantity: number
  unit_price: number
}

interface OrderFormProps {
  clients: Client[]
  employees: { id: string; full_name: string; role: string }[]
  userRole: UserRole
}

export function OrderForm({ clients, employees, userRole }: OrderFormProps) {
  const [state, formAction, isPending] = useActionState<OrderFormState, FormData>(createOrderAction, null)

  const [clientId, setClientId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])

  // New client form
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [clientPending, startClientTransition] = useTransition()

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  function handleCreateClient() {
    if (!newClientName.trim()) return
    startClientTransition(async () => {
      const result = await createClientAction({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
      })
      if (result && 'id' in result) {
        setClientId(result.id)
        setShowNewClient(false)
        setNewClientName('')
        setNewClientPhone('')
      }
    })
  }

  async function handleProductSearch() {
    if (!productSearch.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(productSearch)}`)
      const data = await res.json()
      setSearchResults(data.products ?? [])
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }

  function addItem(product: Product) {
    if (items.some((i) => i.product_id === product.id)) return
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_unit: product.unit,
      quantity: 1,
      unit_price: product.price,
    }])
    setSearchResults([])
    setProductSearch('')
  }

  function updateItem(index: number, field: 'quantity' | 'unit_price', value: number) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  function handleSubmit(formData: FormData) {
    const itemsForSubmit = items.map(({ product_id, quantity, unit_price }) => ({
      product_id,
      quantity,
      unit_price,
    }))
    formData.set('items', JSON.stringify(itemsForSubmit))
    formData.set('client_id', clientId)
    formData.set('assigned_to', assignedTo)
    formData.set('note', note)
    formData.set('phone', phone)
    formAction(formData)
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(n)

  return (
    <form action={handleSubmit} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Client + Assigned */}
      <div className={`grid grid-cols-1 ${userRole !== 'employee' ? 'sm:grid-cols-2' : ''} gap-4`}>
        <div className="space-y-2">
          <label className={labelCls}>Клиент</label>
          {!showNewClient ? (
            <div className="flex gap-2">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={selectCls}
              >
                <option value="">Без клиента</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` (${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                title="Новый клиент"
              >
                <UserPlus size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Имя клиента *"
                className={inputCls}
              />
              <input
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Телефон"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={clientPending || !newClientName.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {clientPending ? 'Создаю...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewClient(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-white transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Исполнитель — только для менеджеров и админов */}
        {userRole !== 'employee' && (
        <div className="space-y-2">
          <label className={labelCls}>Исполнитель</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={selectCls}
          >
            <option value="">Не назначен</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
        )}
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className={labelCls}>Заметка к заказу</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: Доставка до 15:00, подъезд 2"
          className={inputCls}
        />
      </div>

      {/* Contact phone */}
      <div className="space-y-2">
        <label className={labelCls}>Контактный телефон <span className="text-red-500">*</span></label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="87771234567"
          required
          className={cn(inputCls, phone && !isValidPhone(phone) && 'border-amber-400 focus-visible:border-amber-400 focus-visible:ring-amber-400/20')}
        />
        {phone && !isValidPhone(phone) && (
          <p className="text-[12px] text-amber-600">Введите 11 цифр, например: 87771234567</p>
        )}
      </div>

      {/* Product search + add items */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-slate-400" />
          <span className={labelCls}>Позиции заказа</span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleProductSearch()
                  }
                }}
                placeholder="Поиск товара по артикулу или названию..."
                className={cn(inputCls, 'pl-9')}
              />
            </div>
            <button
              type="button"
              onClick={handleProductSearch}
              disabled={searching || !productSearch.trim()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Найти
            </button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addItem(product)}
                  disabled={items.some((i) => i.product_id === product.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-slate-50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{product.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[13px] font-semibold text-slate-700">{formatPrice(product.price)}</p>
                    <p className="text-[11px] text-slate-400">Остаток: {product.stock}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_100px_120px_120px_40px] gap-2 px-4 py-2 bg-slate-50/50 border-b border-slate-100 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span>Товар</span>
              <span className="text-right">Кол-во</span>
              <span className="text-right">Цена</span>
              <span className="text-right">Сумма</span>
              <span></span>
            </div>

            {items.map((item, i) => (
              <div key={item.product_id} className="grid sm:grid-cols-[1fr_100px_120px_120px_40px] gap-2 px-4 py-2.5 border-b border-slate-50 last:border-0 items-center">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{item.product_name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.product_sku}</p>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="h-8 rounded-md border border-slate-200 px-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="h-8 rounded-md border border-slate-200 px-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="text-[13px] font-semibold text-slate-800 text-right">
                  {formatPrice(item.quantity * item.unit_price)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="justify-self-center text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Total */}
            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Итого:</span>
              <span className="text-lg font-bold text-slate-900">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
            <Package size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Найдите и добавьте товары в заказ</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Создать заказ
        </button>
      </div>
    </form>
  )
}
