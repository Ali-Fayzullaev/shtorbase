'use client'

import { Menu } from 'lucide-react'
import { useMobileMenu } from './mobile-menu-context'

export function MobileMenuButton() {
  const { toggle } = useMobileMenu()

  return (
    <button
      onClick={toggle}
      className="lg:hidden fixed top-3.5 left-3 z-30 rounded-lg bg-white/80 backdrop-blur border border-slate-200 p-1.5 text-slate-500 hover:text-slate-700 shadow-sm transition-colors"
      aria-label="Меню"
    >
      <Menu size={18} />
    </button>
  )
}
