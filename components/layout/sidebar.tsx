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
  employee: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  manager: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  admin: 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useMobileMenu()
  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={close} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-white border-r border-slate-200/80 transition-transform duration-200 lg:translate-x-0 lg:z-30',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-[60px] items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-base shadow-md shadow-indigo-500/20">
              Ш
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight">ШторБаза</h1>
              <p className="text-[11px] text-slate-400 leading-none">Управление товарами</p>
            </div>
          </div>
          <button
            onClick={close}
            className="lg:hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 font-semibold text-xs">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-700 truncate leading-tight">{userName}</p>
            <span className={cn('inline-block mt-0.5 rounded px-1.5 py-[1px] text-[10px] font-medium leading-tight', roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
      </aside>
    </>
  )
}
