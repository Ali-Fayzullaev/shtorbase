'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/format'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  Plus,
} from 'lucide-react'
import { type UserRole } from '@/lib/types/database'

interface SidebarProps {
  role: UserRole
  userName: string
}

const navigation = [
  { name: 'Главная', href: '/', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { name: 'Каталог', href: '/catalog', icon: Package, roles: ['employee', 'manager', 'admin'] },
  { name: 'Добавить товар', href: '/products/new', icon: Plus, roles: ['manager', 'admin'] },
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
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()

  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm">
          Ш
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">ШторБаза</h1>
          <p className="text-[10px] text-muted leading-none">Управление ассортиментом</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-background hover:text-foreground'
              )}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : ''} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
