'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

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

function getIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [accent, setAccentState] = useState<AccentColor>('indigo')
  const [glass, setGlassState] = useState(true)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    const savedAccent = (localStorage.getItem('accent') as AccentColor) || 'indigo'
    const savedGlass = localStorage.getItem('glass')
    const glassOn = savedGlass === null ? true : savedGlass === '1'

    setThemeState(savedTheme)
    setAccentState(savedAccent)
    setGlassState(glassOn)

    const dark = getIsDark(savedTheme)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)

    if (savedAccent !== 'indigo') {
      document.documentElement.setAttribute('data-accent', savedAccent)
    } else {
      document.documentElement.removeAttribute('data-accent')
    }

    if (glassOn) {
      document.documentElement.setAttribute('data-glass', '')
    } else {
      document.documentElement.removeAttribute('data-glass')
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

  const setGlass = useCallback((g: boolean) => {
    setGlassState(g)
    localStorage.setItem('glass', g ? '1' : '0')
    if (g) {
      document.documentElement.setAttribute('data-glass', '')
    } else {
      document.documentElement.removeAttribute('data-glass')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, accent, glass, setTheme, setAccent, setGlass, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
