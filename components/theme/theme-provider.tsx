'use client'

import { createContext, useContext, useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { useLocalStorageState } from '@/lib/hooks/use-local-storage-state'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'indigo' | 'violet' | 'rose' | 'amber' | 'emerald' | 'sky'

interface ThemeContextType {
  theme: Theme
  accent: AccentColor
  glass: boolean
  setTheme: (t: Theme) => void
  setAccent: (a: AccentColor) => void
  setGlass: (g: boolean) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  accent: 'indigo',
  glass: true,
  setTheme: () => {},
  setAccent: () => {},
  setGlass: () => {},
  isDark: false,
})

function parseTheme(raw: string | null): Theme {
  return raw === 'dark' || raw === 'light' || raw === 'system' ? raw : 'light'
}

function parseAccent(raw: string | null): AccentColor {
  return raw === 'violet' || raw === 'rose' || raw === 'amber' || raw === 'emerald' || raw === 'sky' ? raw : 'indigo'
}

function subscribeToSystemTheme(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

/** Живо следит за системной темой ОС — нужно только когда theme === 'system'. */
function useSystemIsDark(): boolean {
  return useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeStored] = useLocalStorageState<Theme>('theme', parseTheme, (v) => v, 'light')
  const [accent, setAccentStored] = useLocalStorageState<AccentColor>('accent', parseAccent, (v) => v, 'indigo')
  const [glass, setGlass] = useState(false)

  const systemIsDark = useSystemIsDark()
  const isDark = theme === 'dark' ? true : theme === 'light' ? false : systemIsDark

  // DOM — «внешняя система» относительно React-состояния, поэтому мутации
  // здесь, а не в теле рендера. Мгновенная подсветка при первой загрузке уже
  // обеспечена блокирующим public/theme-init.js — эти эффекты лишь держат
  // <html> в синхроне с последующими изменениями (переключение вручную,
  // смена системной темы).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    if (accent !== 'indigo') {
      document.documentElement.setAttribute('data-accent', accent)
    } else {
      document.documentElement.removeAttribute('data-accent')
    }
  }, [accent])

  useEffect(() => {
    if (glass) {
      document.documentElement.setAttribute('data-glass', '')
    } else {
      document.documentElement.removeAttribute('data-glass')
    }
  }, [glass])

  const setTheme = useCallback((t: Theme) => setThemeStored(t), [setThemeStored])
  const setAccent = useCallback((a: AccentColor) => setAccentStored(a), [setAccentStored])

  return (
    <ThemeContext.Provider value={{ theme, accent, glass, setTheme, setAccent, setGlass, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
