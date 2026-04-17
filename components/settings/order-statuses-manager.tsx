'use client'

import { useState, useTransition } from 'react'
import { type OrderStatusConfig } from '@/lib/types/database'
import { createOrderStatus, updateOrderStatus, deleteOrderStatus, reorderStatuses } from '@/lib/actions/settings-data'
import { cn } from '@/lib/utils/format'
import { Plus, Pencil, Trash2, Loader2, X, Check, ArrowUp, ArrowDown } from 'lucide-react'

const colorPresets = [
  { label: 'Синий', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { label: 'Жёлтый', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { label: 'Зелёный', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { label: 'Серый', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  { label: 'Красный', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  { label: 'Фиолетовый', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { label: 'Розовый', color: 'bg-pink-50 text-pink-700 border-pink-200', dot: 'bg-pink-500' },
  { label: 'Бирюзовый', color: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  { label: 'Индиго', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
]

interface OrderStatusesManagerProps {
  initial: OrderStatusConfig[]
}

export function OrderStatusesManager({ initial }: OrderStatusesManagerProps) {
  const [statuses, setStatuses] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form
  const [newSlug, setNewSlug] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColorIdx, setNewColorIdx] = useState(0)
  const [addPending, startAddTransition] = useTransition()
  const [addError, setAddError] = useState<string | null>(null)

  // Edit form
  const [editLabel, setEditLabel] = useState('')
  const [editColorIdx, setEditColorIdx] = useState(0)
  const [editPending, startEditTransition] = useTransition()

  // Delete
  const [deletePending, startDeleteTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Reorder
  const [reorderPending, startReorderTransition] = useTransition()

  function handleAdd() {
    if (!newSlug.trim() || !newLabel.trim()) return
    setAddError(null)
    const preset = colorPresets[newColorIdx]
    startAddTransition(async () => {
      const result = await createOrderStatus(newSlug, newLabel, preset.color, preset.dot)
      if (result.error) {
        setAddError(result.error)
      } else {
        setStatuses((prev) => [...prev, {
          id: crypto.randomUUID(),
          slug: newSlug.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          label: newLabel,
          color: preset.color,
          dot_color: preset.dot,
          sort_order: prev.length + 1,
          is_default: false,
        }])
        setNewSlug('')
        setNewLabel('')
        setNewColorIdx(0)
        setShowAdd(false)
      }
    })
  }

  function startEdit(s: OrderStatusConfig) {
    setEditingId(s.id)
    setEditLabel(s.label)
    const idx = colorPresets.findIndex((p) => p.color === s.color)
    setEditColorIdx(idx >= 0 ? idx : 0)
  }

  function handleEdit(id: string) {
    const preset = colorPresets[editColorIdx]
    startEditTransition(async () => {
      const result = await updateOrderStatus(id, editLabel, preset.color, preset.dot)
      if (!result.error) {
        setStatuses((prev) => prev.map((s) =>
          s.id === id ? { ...s, label: editLabel, color: preset.color, dot_color: preset.dot } : s
        ))
        setEditingId(null)
      }
    })
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    startDeleteTransition(async () => {
      const result = await deleteOrderStatus(id)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setStatuses((prev) => prev.filter((s) => s.id !== id))
      }
    })
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= statuses.length) return
    const updated = [...statuses]
    ;[updated[index], updated[newIdx]] = [updated[newIdx], updated[index]]
    setStatuses(updated)
    startReorderTransition(async () => {
      await reorderStatuses(updated.map((s) => s.id))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Статусы заказов</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Настройте статусы, их цвета и очерёдность.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Добавить
        </button>
      </div>

      {deleteError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">Slug (английский)</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="paid"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">Название</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Оплачен"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5">Цвет</label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNewColorIdx(i)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all',
                    preset.color,
                    newColorIdx === i && 'ring-2 ring-offset-1 ring-primary/40'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', preset.dot)} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addPending || !newSlug.trim() || !newLabel.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {addPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Создать
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(null) }}
              className="rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Statuses list */}
      <div className="glass-card rounded-xl overflow-hidden divide-y divide-slate-100">
        {statuses.map((s, i) => (
          <div key={s.id} className="px-4 py-3">
            {editingId === s.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">Название</label>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5">Цвет</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditColorIdx(i)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all',
                          preset.color,
                          editColorIdx === i && 'ring-2 ring-offset-1 ring-primary/40'
                        )}
                      >
                        <span className={cn('h-2 w-2 rounded-full', preset.dot)} />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(s.id)}
                    disabled={editPending || !editLabel.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {editPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border', s.color)}>
                  <span className={cn('h-2 w-2 rounded-full', s.dot_color)} />
                  {s.label}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{s.slug}</span>
                <div className="ml-auto flex items-center gap-0.5">
                  <button
                    onClick={() => handleMove(i, 'up')}
                    disabled={i === 0 || reorderPending}
                    className="rounded-md p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:cursor-default"
                    title="Вверх"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 'down')}
                    disabled={i === statuses.length - 1 || reorderPending}
                    className="rounded-md p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:cursor-default"
                    title="Вниз"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => startEdit(s)}
                    className="rounded-md p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                    title="Редактировать"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletePending}
                    className="rounded-md p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
