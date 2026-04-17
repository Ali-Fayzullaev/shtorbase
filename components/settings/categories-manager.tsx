'use client'

import { useState, useTransition } from 'react'
import { type Category } from '@/lib/types/database'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/settings-data'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'

const inputCls =
  'flex h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
const btnCls =
  'inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50'

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const [items, setItems] = useState(initial)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!newName.trim()) return
    setError('')
    startTransition(async () => {
      const result = await createCategory(newName.trim())
      if (result.error) { setError(result.error); return }
      setNewName('')
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCategories())
    })
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      const result = await updateCategory(id, editName.trim())
      if (result.error) { setError(result.error); return }
      setEditingId(null)
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCategories())
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить категорию «${name}»?`)) return
    setError('')
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) { setError(result.error); return }
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCategories())
    })
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Категории товаров</h3>
        <p className="text-xs text-slate-500 mb-4">
          Добавляйте и редактируйте. Удалить можно только неиспользуемые.
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
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Новая категория..."
            className={inputCls}
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                    className={cn(inputCls, 'flex-1')}
                    autoFocus
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
                  <button
                    onClick={() => { setEditingId(item.id); setEditName(item.name) }}
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
            <li className="py-4 text-center text-xs text-slate-400">Нет категорий</li>
          )}
        </ul>
      </div>
    </div>
  )
}
