'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'indigo' | 'violet' | 'rose' | 'amber' | 'emerald' | 'sky'

interface ThemeContextType {
  theme: Theme
  accent: AccentColor
  setTheme: (t: Theme) => void
  setAccent: (a: AccentColor) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  accent: 'indigo',
  setTheme: () => {},
  setAccent: () => {},
  isDark: false,
})

function getIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [accent, setAccentState] = useState<AccentColor>('indigo')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    const savedAccent = (localStorage.getItem('accent') as AccentColor) || 'indigo'
    setThemeState(savedTheme)
    setAccentState(savedAccent)

    const dark = getIsDark(savedTheme)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)

    if (savedAccent !== 'indigo') {
      document.documentElement.setAttribute('data-accent', savedAccent)
    } else {
      document.documentElement.removeAttribute('data-accent')
    }

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange() {
      if ((localStorage.getItem('theme') || 'system') === 'system') {
        const dark = mq.matches
        setIsDark(dark)
        document.documentElement.classList.toggle('dark', dark)
      }
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    const dark = getIsDark(t)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a)
    localStorage.setItem('accent', a)
    if (a !== 'indigo') {
      document.documentElement.setAttribute('data-accent', a)
    } else {
      document.documentElement.removeAttribute('data-accent')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
