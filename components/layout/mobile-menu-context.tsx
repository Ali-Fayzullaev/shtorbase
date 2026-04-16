'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

interface MobileMenuContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Swipe gesture: right from left edge opens, left closes
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = Math.abs(touch.clientY - touchStart.current.y)

      // Horizontal swipe (more horizontal than vertical, at least 60px)
      if (Math.abs(dx) > 60 && dy < 100) {
        // Swipe right from left edge → open
        if (dx > 0 && touchStart.current.x < 30) {
          setIsOpen(true)
        }
        // Swipe left while open → close
        if (dx < 0 && isOpen) {
          setIsOpen(false)
        }
      }
      touchStart.current = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isOpen])

  return (
    <MobileMenuContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}
