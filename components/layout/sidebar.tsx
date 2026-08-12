'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/format'
import { useMobileMenu } from './mobile-menu-context'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  Plus,
  LogOut,
  X,
  ShoppingCart,
  UserCircle,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  Boxes,
} from 'lucide-react'
import { type UserRole } from '@/lib/types/database'
import { logoutAction } from '@/lib/actions/auth'

interface SidebarProps {
  role: UserRole
  userName: string
  logoUrl?: string | null
  companyName?: string | null
}

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  roles: string[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Основные',
    items: [
      { name: 'Главная', href: '/', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
      { name: 'Каталог', href: '/catalog', icon: Package, roles: ['manager', 'admin'] },
      { name: 'Заказы', href: '/orders', icon: ShoppingCart, roles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    label: 'Управление',
    items: [
      { name: 'Товары', href: '/products', icon: Boxes, roles: ['manager', 'admin'] },
      { name: 'Добавить товар', href: '/products/new', icon: Plus, roles: ['manager', 'admin'] },
      { name: 'Логи изменений', href: '/audit', icon: ClipboardList, roles: ['admin'] },
      { name: 'Отчёты', href: '/reports', icon: BarChart3, roles: ['admin'] },
    ],
  },
  {
    label: 'Система',
    items: [
      { name: 'Пользователи', href: '/users', icon: Users, roles: ['admin'] },
      { name: 'Настройки', href: '/settings', icon: Settings, roles: ['admin'] },
      { name: 'Профиль', href: '/account', icon: UserCircle, roles: ['employee', 'manager', 'admin'] },
    ],
  },
]

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

const roleColors: Record<UserRole, string> = {
  employee: 'bg-sky-100 text-sky-700',
  manager: 'bg-amber-100 text-amber-700',
  admin: 'bg-violet-100 text-violet-700',
}

function getInitials(name: string) {
  return name.split(/[\s@]+/)[0]?.slice(0, 2).toUpperCase() ?? '??'
}

function getDisplayName(name: string) {
  if (name.includes('@')) return name.split('@')[0]
  return name
}

export function Sidebar({ role, userName, logoUrl, companyName }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useMobileMenu()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setCollapsed(saved === 'true')
    } else {
      setCollapsed(window.innerWidth < 1280)
    }
    setMounted(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => item.roles.includes(role))
        .map((item) =>
          item.href === '/catalog' && role === 'manager'
            ? { ...item, name: 'Оформить заказ' }
            : item
        ),
    }))
    .filter((group) => group.items.length > 0)

  const displayName = companyName && companyName.length > 0 ? companyName : 'ШторБаза'

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header / Logo */}
      <div className={cn(
        'flex h-16 shrink-0 items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80',
        collapsed ? 'justify-center px-0' : 'px-4'
      )}>
        <div className={cn(
          'shrink-0 flex items-center justify-center rounded-xl overflow-hidden',
          logoUrl
            ? 'h-8 w-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            : 'h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20'
        )}>
          {logoUrl ? (
            <div className="relative w-full h-full">
              <Image src={logoUrl} alt={displayName} fill className="object-contain p-1" sizes="32px" unoptimized />
            </div>
          ) : (
            <span className="text-white font-bold text-sm">{displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div className={cn(
          'flex-1 min-w-0 transition-all duration-200',
          collapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
        )}>
          <h1 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {displayName}
          </h1>
          <p className="text-[10px] text-zinc-400 whitespace-nowrap">Управление товарами</p>
        </div>

        <button
          onClick={close}
          className={cn('lg:hidden rounded-md p-1 text-zinc-400 hover:bg-zinc-100 transition-colors', collapsed && 'hidden')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {filteredGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-5')}>
            {/* Group label */}
            <div className={cn(
              'transition-all duration-200 overflow-hidden',
              collapsed ? 'h-0 opacity-0 mb-0' : 'h-5 opacity-100 mb-1'
            )}>
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                {group.label}
              </p>
            </div>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                        collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                      )}
                    >
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                      )}
                      <item.icon
                        size={collapsed ? 18 : 17}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={cn(
                          'shrink-0 transition-colors duration-200',
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                        )}
                      />
                      <span className={cn(
                        'transition-all duration-200 overflow-hidden whitespace-nowrap',
                        collapsed ? 'w-0 opacity-0' : 'opacity-100'
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px mx-3 bg-zinc-100 dark:bg-zinc-800/80" />

      {/* Collapse toggle */}
      <div className={cn('px-2 py-2', collapsed ? 'flex justify-center' : '')}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          className={cn(
            'flex items-center gap-2 rounded-xl text-[12px] font-medium text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all duration-200',
            collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2'
          )}
        >
          {collapsed ? <PanelLeft size={16} /> : <><PanelLeftClose size={16} /><span>Свернуть</span></>}
        </button>
      </div>

      {/* User card */}
      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/80">
        {collapsed ? (
          /* Collapsed: just avatar centered, logout hidden (expand to log out) */
          <div className="flex flex-col items-center gap-1.5 py-2">
            <div
              title={getDisplayName(userName)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-semibold text-[11px] shadow-sm"
            >
              {getInitials(userName)}
            </div>
          </div>
        ) : (
          /* Expanded: full user card */
          <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-semibold text-[11px] shadow-sm">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                {getDisplayName(userName)}
              </p>
              <span className={cn('inline-block rounded-md px-1.5 py-px text-[10px] font-medium mt-0.5', roleColors[role])}>
                {roleLabels[role]}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Выйти"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all duration-200"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 h-full border-r border-zinc-200 dark:border-zinc-800/80 overflow-hidden',
          'transition-[width] duration-300 ease-in-out',
          mounted ? (collapsed ? 'w-[72px]' : 'w-60') : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (always expanded) */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in" onClick={close} />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 shadow-2xl lg:hidden animate-slide-in-left overflow-hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
