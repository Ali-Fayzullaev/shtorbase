'use client'

import { useEffect, useState, useTransition, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/types/database'
import Link from 'next/link'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    startTransition(async () => {
      const [notifs, count] = await Promise.all([getNotifications(), getUnreadCount()])
      setNotifications(notifs)
      setUnread(count)
    })
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkRead(id: string) {
    await markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkAll() {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-dropdown rounded-xl z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-700">
            <span className="text-sm font-semibold text-zinc-700">Уведомления</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:text-blue-800">
                Прочитать все
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-zinc-400 text-center">Нет уведомлений</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {n.link ? (
                        <Link href={n.link} onClick={() => { handleMarkRead(n.id); setOpen(false) }} className="text-sm font-medium text-zinc-800 hover:text-blue-600">
                          {n.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-zinc-800">{n.title}</p>
                      )}
                      <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {new Date(n.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => handleMarkRead(n.id)} className="shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500" title="Отметить прочитанным" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
