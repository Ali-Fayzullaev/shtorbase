'use client'

import { Menu } from 'lucide-react'
import { useMobileMenu } from './mobile-menu-context'

export function MobileMenuButton() {
  const { toggle } = useMobileMenu()

  return (
    <button
      onClick={toggle}
      className="lg:hidden fixed top-3 left-3 z-30 rounded-lg bg-white border border-slate-200 p-2 text-slate-500 hover:text-slate-700 shadow-sm transition-colors"
      aria-label="Меню"
    >
      <Menu size={20} />
    </button>
  )
}
