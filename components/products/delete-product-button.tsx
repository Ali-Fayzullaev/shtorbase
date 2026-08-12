'use client'

import { useState, useTransition } from 'react'
import { deleteProductAction } from '@/lib/actions/product-mutations'
import { Trash2 } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils/format'

interface DeleteProductButtonProps {
  productId: string
  productName: string
  /** Иконка без текста — для узких мест вроде строки таблицы */
  compact?: boolean
}

export function DeleteProductButton({ productId, productName, compact }: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAction(productId)
      if (result?.error) {
        toast.error(result.error)
        setOpen(false)
      }
      // success → редирект происходит в action
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Снять с продажи"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors',
          compact ? 'p-1.5' : 'px-3 py-1.5'
        )}
      >
        <Trash2 size={14} />
        {!compact && 'Снять с продажи'}
      </button>
      <ConfirmDialog
        open={open}
        tone="danger"
        title={`Снять с продажи «${productName}»?`}
        description="Товар останется в базе (soft delete) и будет скрыт из каталога."
        confirmLabel="Да, снять"
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
