'use client'

import { useState, useTransition } from 'react'

export interface UseConfirmDeleteArgs<T> {
  onDelete: (item: T) => Promise<{ error?: string } | void>
  onSuccess?: (item: T) => void
  onError?: (msg: string, item: T) => void
}

/**
 * Общий паттерн для delete с подтверждением.
 * Возвращает состояние диалога + handlers.
 */
export function useConfirmDelete<T>({ onDelete, onSuccess, onError }: UseConfirmDeleteArgs<T>) {
  const [item, setItem] = useState<T | null>(null)
  const [pending, startTransition] = useTransition()

  const ask = (value: T) => setItem(value)
  const close = () => {
    if (!pending) setItem(null)
  }

  const confirm = () => {
    if (!item) return
    const target = item
    startTransition(async () => {
      try {
        const result = await onDelete(target)
        if (result && 'error' in result && result.error) {
          onError?.(result.error, target)
        } else {
          onSuccess?.(target)
          setItem(null)
        }
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Ошибка удаления', target)
      }
    })
  }

  return { item, open: item !== null, pending, ask, close, confirm }
}
