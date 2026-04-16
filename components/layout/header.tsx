'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { NotificationBell } from './notification-bell'

interface HeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

const breadcrumbMap: Record<string, string> = {
  '/': 'Главная',
  '/catalog': 'Каталог',
  '/orders': 'Заказы',
  '/orders/new': 'Новый заказ',
  '/products/new': 'Новый товар',
  '/import': 'Импорт',
  '/audit': 'Логи',
  '/users': 'Пользователи',
  '/settings': 'Настройки',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []

  let path = ''
  for (const part of parts) {
    path += `/${part}`
    const label = breadcrumbMap[path]
    if (label) {
      crumbs.push({ label, href: path })
    }
  }

  return crumbs
}

export function Header({ title, description, children }: HeaderProps) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex flex-col justify-center min-w-0">
          {/* Breadcrumbs */}
          {crumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[11px] text-zinc-400 -mb-0.5">
              <Link href="/" className="hover:text-zinc-600 transition-colors">
                <Home size={11} />
              </Link>
              {crumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight size={10} className="text-zinc-300" />
                  {i === crumbs.length - 1 ? (
                    <span className="text-zinc-500 font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-zinc-600 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-zinc-900 truncate">{title}</h1>
            {description && (
              <span className="hidden sm:inline text-sm text-zinc-400 shrink-0">{description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <NotificationBell />
          {children}
        </div>
      </div>
      {/* Gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
    </header>
  )
}
