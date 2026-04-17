'use client'

import { useState, useTransition } from 'react'
import { type Category } from '@/lib/types/database'
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/settings-data'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/utils/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
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

  const del = useConfirmDelete<Category>({
    onDelete: (c) => deleteCategory(c.id),
    onSuccess: async (c) => {
      toast.success(`Категория «${c.name}» удалена`)
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCategories())
    },
    onError: (msg) => setError(msg),
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">Категории товаров</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
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
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-800 dark:text-zinc-200">{item.name}</span>
                  <button
                    onClick={() => { setEditingId(item.id); setEditName(item.name) }}
                    className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => del.ask(item)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">Нет категорий</li>
          )}
        </ul>
      </div>
      <ConfirmDialog
        open={del.open}
        tone="danger"
        title={del.item ? `Удалить категорию «${del.item.name}»?` : ''}
        description="Удалить можно только неиспользуемые категории."
        confirmLabel="Удалить"
        loading={del.pending}
        onConfirm={del.confirm}
        onCancel={del.close}
      />
    </div>
  )
}
