'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

/**
 * Глобальные клавиатурные сокращения:
 *  - `/` — фокус на поиск (input[data-shortcut="search"])
 *  - `n` — создать новый товар
 *  - `g` затем `o` — перейти в заказы; `g` `p` — товары; `g` `d` — дашборд
 *  - `?` — показать подсказку
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  const [help, setHelp] = useState(false)

  useEffect(() => {
    let leader: string | null = null
    let leaderTimer: ReturnType<typeof setTimeout> | null = null

    const clearLeader = () => {
      leader = null
      if (leaderTimer) { clearTimeout(leaderTimer); leaderTimer = null }
    }

    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isEditable(e.target)) return

      if (e.key === '?') {
        e.preventDefault()
        setHelp((v) => !v)
        return
      }
      if (e.key === 'Escape' && help) {
        setHelp(false)
        return
      }

      if (leader === 'g') {
        const map: Record<string, string> = { o: '/orders', p: '/products', d: '/dashboard', c: '/catalog', s: '/settings' }
        const path = map[e.key.toLowerCase()]
        if (path) {
          e.preventDefault()
          router.push(path)
        }
        clearLeader()
        return
      }

      if (e.key === '/') {
        const input = document.querySelector<HTMLInputElement>('input[data-shortcut="search"]')
        if (input) { e.preventDefault(); input.focus(); input.select() }
        return
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        router.push('/products/new')
        return
      }
      if (e.key.toLowerCase() === 'g') {
        leader = 'g'
        leaderTimer = setTimeout(clearLeader, 1200)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (leaderTimer) clearTimeout(leaderTimer)
    }
  }, [router, help])

  if (!help) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Клавиатурные сокращения"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={() => setHelp(false)}
    >
      <div
        className="glass-card w-full max-w-md rounded-2xl bg-white p-6 text-sm dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-zinc-100">Клавиатурные сокращения</h2>
        <dl className="space-y-2 text-slate-600 dark:text-zinc-400">
          {[
            ['/', 'Поиск'],
            ['n', 'Новый товар'],
            ['g o', 'Заказы'],
            ['g p', 'Товары'],
            ['g d', 'Дашборд'],
            ['g c', 'Каталог'],
            ['g s', 'Настройки'],
            ['?', 'Показать/скрыть эту справку'],
            ['Esc', 'Закрыть'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{k}</kbd>
              <span>{v}</span>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
