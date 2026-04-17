'use client'

import { useState, useTransition } from 'react'
import { type Unit } from '@/lib/types/database'
import { createUnit, updateUnit, deleteUnit } from '@/lib/actions/settings-data'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'

const inputCls =
  'flex h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
const btnCls =
  'inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50'

export function UnitsManager({ initial }: { initial: Unit[] }) {
  const [items, setItems] = useState(initial)
  const [newName, setNewName] = useState('')
  const [newShort, setNewShort] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editShort, setEditShort] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!newName.trim() || !newShort.trim()) return
    setError('')
    startTransition(async () => {
      const result = await createUnit(newName.trim(), newShort.trim())
      if (result.error) { setError(result.error); return }
      setNewName('')
      setNewShort('')
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getUnits())
    })
  }

  function handleUpdate(id: string) {
    if (!editName.trim() || !editShort.trim()) return
    startTransition(async () => {
      const result = await updateUnit(id, editName.trim(), editShort.trim())
      if (result.error) { setError(result.error); return }
      setEditingId(null)
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getUnits())
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить единицу «${name}»?`)) return
    setError('')
    startTransition(async () => {
      const result = await deleteUnit(id)
      if (result.error) { setError(result.error); return }
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getUnits())
    })
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Единицы измерения</h3>
        <p className="text-xs text-slate-500 mb-4">
          Единицы отображаются при создании товара. По умолчанию: Метр (м), Штука (шт).
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название (напр. Метр)"
            className={cn(inputCls, 'flex-1')}
          />
          <input
            value={newShort}
            onChange={(e) => setNewShort(e.target.value)}
            placeholder="Сокр. (м)"
            className={cn(inputCls, 'w-20')}
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim() || !newShort.trim()}
            className={cn(btnCls, 'bg-primary text-primary-foreground hover:bg-primary/90 gap-1 shrink-0')}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Добавить
          </button>
        </div>

        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              {editingId === item.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={cn(inputCls, 'flex-1')}
                    autoFocus
                  />
                  <input
                    value={editShort}
                    onChange={(e) => setEditShort(e.target.value)}
                    className={cn(inputCls, 'w-20')}
                  />
                  <button onClick={() => handleUpdate(item.id)} disabled={isPending} className="p-1.5 rounded-md text-green-600 hover:bg-green-50">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-800">{item.name}</span>
                  <span className="text-xs text-slate-400 bg-slate-50 rounded px-1.5 py-0.5">{item.short_name}</span>
                  <button
                    onClick={() => { setEditingId(item.id); setEditName(item.name); setEditShort(item.short_name) }}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-4 text-center text-xs text-slate-400">Нет единиц измерения</li>
          )}
        </ul>
      </div>
    </div>
  )
}
