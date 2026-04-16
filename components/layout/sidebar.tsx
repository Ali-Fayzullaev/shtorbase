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

const navigation = [
  { name: 'Главная', href: '/', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { name: 'Каталог', href: '/catalog', icon: Package, roles: ['employee', 'manager', 'admin'] },
  { name: 'Заказы', href: '/orders', icon: ShoppingCart, roles: ['employee', 'manager', 'admin'] },
  { name: 'Добавить товар', href: '/products/new', icon: Plus, roles: ['manager', 'admin'] },
  { name: 'Импорт остатков', href: '/import', icon: Upload, roles: ['manager', 'admin'] },
  { name: 'Логи изменений', href: '/audit', icon: ClipboardList, roles: ['manager', 'admin'] },
  { name: 'Пользователи', href: '/users', icon: Users, roles: ['admin'] },
  { name: 'Настройки', href: '/settings', icon: Settings, roles: ['admin'] },
]

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

const roleColors: Record<UserRole, string> = {
  employee: 'bg-sky-50 text-sky-700',
  manager: 'bg-amber-50 text-amber-700',
  admin: 'bg-violet-50 text-violet-700',
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
  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
          Ш
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">ШторБаза</h1>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Управление товарами</p>
        </div>
        <button
          onClick={close}
          className="lg:hidden rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User card */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px]">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-800 truncate">{getDisplayName(userName)}</p>
            <span className={cn('inline-block rounded px-1.5 py-px text-[10px] font-medium mt-0.5', roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-500 transition-colors"
              title="Выйти"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always in flex flow */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — fixed overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={close} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
