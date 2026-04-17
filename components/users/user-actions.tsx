'use client'

import { useState, useTransition } from 'react'
import { changeUserRole, toggleUserActive, deleteUser } from '@/lib/actions/users'
import { type UserRole } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'
import { Trash2 } from 'lucide-react'

const roleLabels: Record<UserRole, string> = {
  employee: 'Сотрудник',
  manager: 'Менеджер',
  admin: 'Администратор',
}

interface UserRoleSelectProps {
  userId: string
  currentRole: UserRole
  isSelf: boolean
}

export function UserRoleSelect({ userId, currentRole, isSelf }: UserRoleSelectProps) {
  const [pending, startTransition] = useTransition()

  const handleChange = (newRole: string) => {
    startTransition(async () => {
      await changeUserRole(userId, newRole as UserRole)
    })
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isSelf || pending}
      className={cn(
        'rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-2 py-1 text-[12px] text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all',
        isSelf && 'opacity-50 cursor-not-allowed',
      )}
    >
      {(Object.keys(roleLabels) as UserRole[]).map((role) => (
        <option key={role} value={role}>
          {roleLabels[role]}
        </option>
      ))}
    </select>
  )
}

interface ToggleActiveButtonProps {
  userId: string
  isActive: boolean
  isSelf: boolean
}

export function ToggleActiveButton({ userId, isActive, isSelf }: ToggleActiveButtonProps) {
  const [pending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleUserActive(userId, !isActive)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSelf || pending}
      className={cn(
        'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
        isActive
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
        (isSelf || pending) && 'opacity-50 cursor-not-allowed',
      )}
    >
      {pending ? '...' : isActive ? 'Деактивировать' : 'Активировать'}
    </button>
  )
}

interface DeleteUserButtonProps {
  userId: string
  userName: string
  isSelf: boolean
}

export function DeleteUserButton({ userId, userName, isSelf }: DeleteUserButtonProps) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    startTransition(async () => {
      await deleteUser(userId)
      setConfirming(false)
    })
  }

  if (isSelf) return null

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
        confirming
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50',
        pending && 'opacity-50',
      )}
      title="Удалить пользователя"
    >
      <Trash2 size={12} />
      {confirming ? 'Подтвердить' : ''}
    </button>
  )
}
