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

const roleColors: Record<UserRole, string> = {
  employee: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  manager: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  admin: 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
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

  return (
    <>
      <Header title="Пользователи" description={`${users.length} пользователей`} />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Registration toggle */}
        <RegistrationToggle allowed={regAllowed} />

        {/* Create user directly */}
        <CreateUserForm />

        {/* Users table */}
        <div className="overflow-x-auto rounded-xl glass-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Пользователь</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Роль</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Статус</th>
                <th className="hidden sm:table-cell px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 font-semibold text-xs">
                        {getInitials(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-700 truncate">{getDisplayName(user.full_name)}</p>
                        {user.id === profile.id && (
                          <span className="text-[10px] text-slate-400">Вы</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleSelect userId={user.id} currentRole={user.role} isSelf={user.id === profile.id} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                        user.is_active
                          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                          : 'bg-red-50 text-red-500 ring-1 ring-red-200',
                      )}
                    >
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-[13px] text-slate-400 tabular-nums">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
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
    </>
  )
}
