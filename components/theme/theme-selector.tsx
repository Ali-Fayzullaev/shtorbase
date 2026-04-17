'use client'

import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Monitor, Palette, Sparkles } from 'lucide-react'
import { useTheme, type Theme, type AccentColor } from './theme-provider'
import { cn } from '@/lib/utils/format'

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Система', icon: Monitor },
]

const accents: { value: AccentColor; label: string; color: string }[] = [
  { value: 'indigo', label: 'Индиго', color: '#4f46e5' },
  { value: 'violet', label: 'Фиолет', color: '#7c3aed' },
  { value: 'rose', label: 'Розовый', color: '#e11d48' },
  { value: 'amber', label: 'Янтарь', color: '#d97706' },
  { value: 'emerald', label: 'Изумруд', color: '#059669' },
  { value: 'sky', label: 'Голубой', color: '#0284c7' },
]

export function ThemeSelector() {
  const [open, setOpen] = useState(false)
  const { theme, accent, glass, setTheme, setAccent, setGlass } = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Оформление"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl glass-dropdown p-3 z-50 animate-scale-in">
          {/* Theme toggle */}
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Тема</p>
          <div className="space-y-0.5 mb-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                  theme === t.value
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                )}
              >
                <t.icon size={15} strokeWidth={theme === t.value ? 2.2 : 1.5} />
                {t.label}
                {theme === t.value && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Glass toggle */}
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Эффекты</p>
          <button
            onClick={() => setGlass(!glass)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all mb-4',
              glass
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
            )}
          >
            <Sparkles size={15} strokeWidth={glass ? 2.2 : 1.5} />
            Стекло
            {glass && (
              <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Accent colors */}
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Акцент</p>
          <div className="grid grid-cols-6 gap-2">
            {accents.map((a) => (
              <button
                key={a.value}
                onClick={() => setAccent(a.value)}
                className={cn(
                  'group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110',
                  accent === a.value && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-800'
                )}
                style={{
                  backgroundColor: a.color,
                  ...(accent === a.value ? { ringColor: a.color } : {}),
                }}
                title={a.label}
              >
                {accent === a.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
