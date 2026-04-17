'use client'

import { useState, useTransition } from 'react'
import { deleteProductAction } from '@/lib/actions/product-mutations'
import { Trash2 } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DeleteProductButtonProps {
  productId: string
  productName: string
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
      >
        <Trash2 size={14} />
        Снять с продажи
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
