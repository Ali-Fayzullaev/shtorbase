'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/format'
import { useMobileMenu } from './mobile-menu-context'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MoreHorizontal,
} from 'lucide-react'

const mainTabs = [
  { name: 'Главная', href: '/', icon: LayoutDashboard },
  { name: 'Каталог', href: '/catalog', icon: Package },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart },
]

export function BottomNav() {
  const pathname = usePathname()
  const { toggle } = useMobileMenu()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden animate-slide-up">
        <div className="glass border-l-0 border-r-0 border-b-0 rounded-none shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex items-stretch">
          {mainTabs.map((tab) => {
            const isActive =
              tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'btn-press relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors duration-200',
                  isActive
                    ? 'text-indigo-600'
                    : 'text-zinc-400 active:text-zinc-600'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                )}
                <tab.icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className="transition-transform duration-200"
                />
                <span
                  className={cn(
                    'text-[10px] leading-none',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            )
          })}

          {/* More button — opens sidebar for additional items */}
          <button
            onClick={toggle}
            className={cn(
              'btn-press flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors duration-200 text-zinc-400 active:text-zinc-600'
            )}
          >
            <MoreHorizontal size={21} strokeWidth={1.5} />
            <span className="text-[10px] font-medium leading-none">Ещё</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
