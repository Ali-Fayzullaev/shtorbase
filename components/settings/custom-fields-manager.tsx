'use client'

import { useState, useTransition } from 'react'
import { type CustomField, type CustomFieldType } from '@/lib/types/database'
import { createCustomField, updateCustomField, deleteCustomField } from '@/lib/actions/settings-data'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/utils/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'

const inputCls =
  'flex h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
const selectCls =
  'flex h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
const btnCls =
  'inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50'

const typeLabels: Record<CustomFieldType, string> = {
  text: 'Текст',
  number: 'Число',
  select: 'Выбор',
}

export function CustomFieldsManager({ initial }: { initial: CustomField[] }) {
  const [items, setItems] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [options, setOptions] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setName('')
    setFieldType('text')
    setOptions('')
    setIsRequired(false)
    setShowForm(false)
    setEditingId(null)
  }

  function handleCreate() {
    if (!name.trim()) return
    setError('')
    const opts = fieldType === 'select' ? options.split(',').map((s) => s.trim()).filter(Boolean) : null
    startTransition(async () => {
      const result = await createCustomField(name.trim(), fieldType, opts, isRequired)
      if (result.error) { setError(result.error); return }
      resetForm()
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCustomFields())
    })
  }

  function handleUpdate() {
    if (!editingId || !name.trim()) return
    const opts = fieldType === 'select' ? options.split(',').map((s) => s.trim()).filter(Boolean) : null
    startTransition(async () => {
      const result = await updateCustomField(editingId, name.trim(), fieldType, opts, isRequired)
      if (result.error) { setError(result.error); return }
      resetForm()
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCustomFields())
    })
  }

  function startEdit(field: CustomField) {
    setEditingId(field.id)
    setName(field.name)
    setFieldType(field.field_type)
    setOptions(field.options?.join(', ') ?? '')
    setIsRequired(field.is_required)
    setShowForm(true)
  }

  const del = useConfirmDelete<CustomField>({
    onDelete: (f) => deleteCustomField(f.id),
    onSuccess: async (f) => {
      toast.success(`Поле «${f.name}» удалено`)
      const mod = await import('@/lib/actions/settings-data')
      setItems(await mod.getCustomFields())
    },
    onError: (msg) => setError(msg),
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">Дополнительные поля товаров</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
          Создавайте свои поля для товаров. Они будут показаны при создании/редактировании товара.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}

        {/* Add/Edit form */}
        {showForm ? (
          <div className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 p-3 mb-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название поля"
                className={cn(inputCls, 'flex-1')}
                autoFocus
              />
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                className={cn(selectCls, 'w-28')}
              >
                <option value="text">Текст</option>
                <option value="number">Число</option>
                <option value="select">Выбор</option>
              </select>
            </div>
            {fieldType === 'select' && (
              <input
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Варианты через запятую: Красный, Синий, Зелёный"
                className={cn(inputCls, 'w-full')}
              />
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-primary"
                />
                Обязательное
              </label>
              <div className="flex gap-2">
                <button onClick={resetForm} className={cn(btnCls, 'border border-input bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800')}>
                  Отмена
                </button>
                <button
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={isPending || !name.trim()}
                  className={cn(btnCls, 'bg-primary text-primary-foreground hover:bg-primary/90 gap-1')}
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className={cn(btnCls, 'bg-primary text-primary-foreground hover:bg-primary/90 gap-1 mb-4')}
          >
            <Plus size={14} />
            Добавить поле
          </button>
        )}

        {/* List */}
        <ul className="divide-y divide-slate-100">
          {items.map((field) => (
            <li key={field.id} className="flex items-center gap-2 py-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-800 dark:text-zinc-200">{field.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded px-1.5 py-px">
                    {typeLabels[field.field_type]}
                  </span>
                  {field.is_required && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 rounded px-1.5 py-px">
                      Обязательное
                    </span>
                  )}
                  {field.options && field.options.length > 0 && (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                      {field.options.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startEdit(field)}
                className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => del.ask(field)}
                disabled={isPending}
                className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">Нет дополнительных полей</li>
          )}
        </ul>
      </div>
      <ConfirmDialog
        open={del.open}
        tone="danger"
        title={del.item ? `Удалить поле «${del.item.name}»?` : ''}
        description="Все значения этого поля в товарах будут потеряны безвозвратно."
        confirmLabel="Удалить"
        loading={del.pending}
        onConfirm={del.confirm}
        onCancel={del.close}
      />
    </div>
  )
}
