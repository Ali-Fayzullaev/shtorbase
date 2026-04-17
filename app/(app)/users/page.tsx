import { Header } from '@/components/layout/header'
import { CreateUserForm } from '@/components/users/create-user-form'
import { RegistrationToggle } from '@/components/users/registration-toggle'
import { UserRoleSelect, ToggleActiveButton, DeleteUserButton } from '@/components/users/user-actions'
import { getUsers } from '@/lib/actions/users'
import { isRegistrationAllowed } from '@/lib/actions/settings'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/format'
import { type UserRole } from '@/lib/types/database'
import { Users as UsersIcon, UserCheck, UserX, ShieldCheck, Briefcase, User as UserIcon } from 'lucide-react'

const roleColors: Record<UserRole, string> = {
  employee: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/60',
  manager: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60',
  admin: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/60',
}

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

function getDisplayName(name: string) {
  if (name.includes('@')) return name.split('@')[0]
  return name
}

function getInitials(name: string) {
  const display = getDisplayName(name)
  const parts = display.split(/[\s._-]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return display.slice(0, 2).toUpperCase()
}

export default async function UsersPage() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')

  const [users, regAllowed] = await Promise.all([
    getUsers(),
    isRegistrationAllowed(),
  ])

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
    employees: users.filter((u) => u.role === 'employee').length,
  }

  return (
    <>
      <Header title="Пользователи" description={`Всего ${users.length}`} />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={UsersIcon} label="Всего" value={stats.total} tone="indigo" />
          <StatCard icon={UserCheck} label="Активных" value={stats.active} tone="emerald" />
          <StatCard icon={ShieldCheck} label="Админы" value={stats.admins} tone="violet" />
          <StatCard icon={Briefcase} label="Менеджеры" value={stats.managers} tone="amber" />
          <StatCard icon={UserIcon} label="Сотрудники" value={stats.employees} tone="sky" />
        </div>

        {/* Two-column: form + registration */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-5 items-start">
          <CreateUserForm />
          <div className="lg:w-80">
            <RegistrationToggle allowed={regAllowed} />
          </div>
        </div>

        {/* Users table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/30 dark:border-white/[0.05]">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Список пользователей</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/60 dark:bg-white/[0.02]">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Пользователь</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Роль</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Статус</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Создан</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/60 dark:to-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold text-xs ring-1 ring-indigo-200/50 dark:ring-indigo-800/40">
                          {getInitials(user.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 dark:text-zinc-200 truncate">{getDisplayName(user.full_name)}</p>
                          {user.id === profile.id && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              <span className="h-1 w-1 rounded-full bg-indigo-500" />
                              Вы
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <UserRoleSelect userId={user.id} currentRole={user.role} isSelf={user.id === profile.id} />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60'
                            : 'bg-red-50 text-red-500 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-red-500')} />
                        {user.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3 text-[12px] text-slate-400 dark:text-zinc-500 tabular-nums">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleActiveButton userId={user.id} isActive={user.is_active} isSelf={user.id === profile.id} />
                        <DeleteUserButton userId={user.id} userName={user.full_name} isSelf={user.id === profile.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

const toneStyles: Record<string, { bg: string; icon: string }> = {
  indigo: { bg: 'from-indigo-500 to-violet-500', icon: 'text-indigo-100' },
  emerald: { bg: 'from-emerald-500 to-teal-500', icon: 'text-emerald-100' },
  violet: { bg: 'from-violet-500 to-fuchsia-500', icon: 'text-violet-100' },
  amber: { bg: 'from-amber-500 to-orange-500', icon: 'text-amber-100' },
  sky: { bg: 'from-sky-500 to-cyan-500', icon: 'text-sky-100' },
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof UsersIcon; label: string; value: number; tone: string }) {
  const s = toneStyles[tone] ?? toneStyles.indigo
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', s.bg)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-zinc-100 tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  )
}
