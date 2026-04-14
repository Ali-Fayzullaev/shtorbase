'use client'

import { useState } from 'react'
import { deleteProductAction } from '@/lib/actions/product-mutations'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteProductButtonProps {
  productId: string
  productName: string
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteProductAction(productId)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      setConfirming(false)
    }
    // redirect happens in the action on success
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={14} />
        Снять с продажи
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-red-600">
        Снять «{productName}»?
      </span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Trash2 size={14} />
        )}
        Да, снять
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        Отмена
      </button>
    </div>
  )
}
