'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/format'

/**
 * Держит доску заказов свежей без ручного обновления страницы: подписывается
 * на изменения таблицы orders через Supabase Realtime (WebSocket поверх
 * Postgres logical replication) и обновляет серверные данные текущего
 * маршрута через router.refresh(), когда кто-то создаёт заказ или меняет статус.
 */
export function OrdersRealtimeSync() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    function scheduleRefresh() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase
      .channel('orders-board')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, scheduleRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, scheduleRefresh)
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        connected
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-white/[0.08] dark:bg-white/[0.03]'
      )}
      title={connected ? 'Доска обновляется в реальном времени' : 'Подключение к реальному времени…'}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300')} />
      {connected ? 'Live' : 'Подключение…'}
    </span>
  )
}
