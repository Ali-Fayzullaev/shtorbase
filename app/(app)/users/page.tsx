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
import { Users as UsersIcon, UserCheck, ShieldCheck, Briefcase, User as UserIcon, Lock, Eye, Settings2 } from 'lucide-react'

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
        {/* Hero */}
        <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-white/[0.06] dark:from-zinc-950 dark:to-zinc-900">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Доступ и роли</div>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Кто работает в системе</h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Здесь вы управляете доступом сотрудников: можете создать аккаунт, сменить роль, заблокировать или удалить. Роль определяет, что человек может делать в приложении.
              </p>

              {/* Role legend */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-violet-200/60 bg-violet-50/60 p-3 dark:border-violet-500/20 dark:bg-violet-950/20">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10">
                    <Lock size={13} className="text-violet-600 dark:text-violet-300" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-violet-700 dark:text-violet-300">Администратор</div>
                    <div className="text-[11px] text-violet-600/70 dark:text-violet-400/70">Полный доступ: пользователи, настройки, аудит</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-950/20">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                    <Settings2 size={13} className="text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">Менеджер</div>
                    <div className="text-[11px] text-amber-600/70 dark:text-amber-400/70">Каталог, заказы, импорт; без управления пользователями</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/60 bg-sky-50/60 p-3 dark:border-sky-500/20 dark:bg-sky-950/20">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/10">
                    <Eye size={13} className="text-sky-600 dark:text-sky-300" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-sky-700 dark:text-sky-300">Сотрудник</div>
                    <div className="text-[11px] text-sky-600/70 dark:text-sky-400/70">Только каталог и заказы, без редактирования</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live stats sidebar */}
            <div className="space-y-2.5 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Состав сейчас</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5">
                  <div className="text-[20px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.total}</div>
                  <div className="text-[11px] text-zinc-400">всего</div>
                </div>
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5">
                  <div className="text-[20px] font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{stats.active}</div>
                  <div className="text-[11px] text-emerald-600/70">активных</div>
                </div>
              </div>
              {stats.inactive > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20 px-3 py-2">
                  <span className="text-[12px] text-red-600 dark:text-red-400">Заблокировано</span>
                  <span className="text-[14px] font-bold tabular-nums text-red-600 dark:text-red-400">{stats.inactive}</span>
                </div>
              )}
              <div className="space-y-1.5 pt-1">
                {[
                  { label: 'Администраторы', value: stats.admins, color: 'bg-violet-400' },
                  { label: 'Менеджеры', value: stats.managers, color: 'bg-amber-400' },
                  { label: 'Сотрудники', value: stats.employees, color: 'bg-sky-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                    <span className="flex-1 text-[12px] text-zinc-500 dark:text-zinc-400">{label}</span>
                    <span className="text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/30 dark:border-white/[0.05]">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Список пользователей</h2>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">{users.length}</span>
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
