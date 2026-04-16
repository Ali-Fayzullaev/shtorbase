'use client'

import Link from 'next/link'
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
  Upload,
  X,
  ShoppingCart,
} from 'lucide-react'
import { type UserRole } from '@/lib/types/database'
import { logoutAction } from '@/lib/actions/auth'

interface SidebarProps {
  role: UserRole
  userName: string
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
      { name: 'Каталог', href: '/catalog', icon: Package, roles: ['employee', 'manager', 'admin'] },
      { name: 'Заказы', href: '/orders', icon: ShoppingCart, roles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    label: 'Управление',
    items: [
      { name: 'Добавить товар', href: '/products/new', icon: Plus, roles: ['manager', 'admin'] },
      { name: 'Импорт остатков', href: '/import', icon: Upload, roles: ['manager', 'admin'] },
      { name: 'Логи изменений', href: '/audit', icon: ClipboardList, roles: ['manager', 'admin'] },
    ],
  },
  {
    label: 'Система',
    items: [
      { name: 'Пользователи', href: '/users', icon: Users, roles: ['admin'] },
      { name: 'Настройки', href: '/settings', icon: Settings, roles: ['admin'] },
    ],
  },
]

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

const roleColors: Record<UserRole, string> = {
  employee: 'bg-sky-100/80 text-sky-700',
  manager: 'bg-amber-100/80 text-amber-700',
  admin: 'bg-violet-100/80 text-violet-700',
}

function getInitials(name: string) {
  return name
    .split(/[\s@]+/)[0]
    ?.slice(0, 2)
    .toUpperCase() ?? '??'
}

function getDisplayName(name: string) {
  if (name.includes('@')) return name.split('@')[0]
  return name
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useMobileMenu()

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
          Ш
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-zinc-800 tracking-tight">ШторБаза</h1>
          <p className="text-[10px] text-zinc-400 leading-none mt-0.5">Управление товарами</p>
        </div>
        <button
          onClick={close}
          className="lg:hidden rounded-md p-1 text-zinc-400 hover:bg-white/60 hover:text-zinc-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {filteredGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-5')}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
                          : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-800 hover:shadow-sm'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                      )}
                      <item.icon
                        size={17}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={cn(
                          'shrink-0 transition-colors duration-200',
                          isActive ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600'
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/60 backdrop-blur-sm px-3 py-3 border border-white/80 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-semibold text-[11px] shadow-sm shadow-indigo-500/20">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-zinc-800 truncate">{getDisplayName(userName)}</p>
            <span className={cn('inline-block rounded-md px-1.5 py-px text-[10px] font-medium mt-0.5', roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-gradient-to-b from-zinc-50 via-zinc-50/80 to-zinc-100/50 border-r border-zinc-200/60 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in" onClick={close} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-zinc-50 via-zinc-50/80 to-zinc-100/50 shadow-2xl lg:hidden animate-slide-in-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
