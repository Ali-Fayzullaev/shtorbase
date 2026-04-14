import { Header } from '@/components/layout/header'
import { InviteForm } from '@/components/users/invite-form'
import { UserRoleSelect, ToggleActiveButton } from '@/components/users/user-actions'
import { getUsers, getInviteTokens } from '@/lib/actions/users'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/format'
import { type UserRole } from '@/lib/types/database'
import { Clock, Mail } from 'lucide-react'

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

export default async function UsersPage() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')

  const [users, pendingInvites] = await Promise.all([getUsers(), getInviteTokens()])

  return (
    <>
      <Header title="Пользователи" description={`${users.length} пользователей`} />

      <div className="p-5 space-y-5">
        <InviteForm />

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <h3 className="text-[13px] font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
              <Clock size={14} />
              Ожидающие приглашения ({pendingInvites.length})
            </h3>
            <div className="space-y-2">
              {pendingInvites.map((invite: { id: string; email: string; full_name: string; role: string; expires_at: string }) => (
                <div key={invite.id} className="flex items-center gap-3 rounded-lg bg-white/80 border border-amber-100 px-3 py-2">
                  <Mail size={14} className="text-amber-500 shrink-0" />
                  <span className="text-[13px] font-medium text-slate-700">{invite.full_name}</span>
                  <span className="text-[12px] text-slate-400">{invite.email}</span>
                  <span className={cn('rounded px-1.5 py-[1px] text-[10px] font-medium', roleColors[invite.role as UserRole])}>
                    {roleLabels[invite.role as UserRole]}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-400">
                    до {formatDate(invite.expires_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Пользователь</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Роль</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Зарегистрирован</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 font-semibold text-xs">
                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{user.full_name}</span>
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
                  <td className="px-4 py-3 text-[13px] text-slate-400 tabular-nums">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleActiveButton userId={user.id} isActive={user.is_active} isSelf={user.id === profile.id} />
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
