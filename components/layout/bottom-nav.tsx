'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/format'
import { useMobileMenu } from './mobile-menu-context'
import { useCart } from '@/components/catalog/catalog-cart'
import { type UserRole } from '@/lib/types/database'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  MoreHorizontal,
} from 'lucide-react'

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const { toggle } = useMobileMenu()
  const { totalItems, openCart } = useCart()
  const canUseCatalog = role !== 'employee'

  const tabs = [
    { name: 'Главная', href: '/', icon: LayoutDashboard },
    ...(canUseCatalog ? [{ name: 'Оформить заказ', href: '/catalog', icon: Package }] : []),
    { name: 'Заказы', href: '/orders', icon: ClipboardList },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden animate-slide-up">
      <div className="glass border-l-0 border-r-0 border-b-0 rounded-none shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'btn-press relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors duration-200',
                  isActive ? 'text-indigo-600' : 'text-zinc-400 active:text-zinc-600'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                )}
                <tab.icon size={21} strokeWidth={isActive ? 2.2 : 1.5} className="transition-transform duration-200" />
                <span className={cn('text-[10px] leading-tight text-center', isActive ? 'font-semibold' : 'font-medium')}>
                  {tab.name}
                </span>
              </Link>
            )
          })}

          {/* Cart button with badge — не нужен сотруднику, у него нет доступа к каталогу */}
          {canUseCatalog && (
            <button
              onClick={openCart}
              className="btn-press relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors duration-200 text-zinc-400 active:text-zinc-600"
            >
              <div className="relative">
                <ShoppingCart size={21} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white tabular-nums ring-1 ring-white">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">Корзина</span>
            </button>
          )}

          {/* More */}
          <button
            onClick={toggle}
            className="btn-press flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors duration-200 text-zinc-400 active:text-zinc-600"
          >
            <MoreHorizontal size={21} strokeWidth={1.5} />
            <span className="text-[10px] font-medium leading-none">Ещё</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
