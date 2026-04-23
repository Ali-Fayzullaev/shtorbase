'use client'

import { useActionState, useState, useEffect } from 'react'
import { inviteUserAction, type InviteState } from '@/lib/actions/invite'
import { UserPlus, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/format'

export function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(inviteUserAction, null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const inviteUrl = state?.token ? `${origin}/invite/${state.token}` : null

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-[15px] font-semibold text-slate-800 dark:text-zinc-200 mb-4">Пригласить пользователя</h2>

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-[13px] text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
              ФИО
            </label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="Иван Иванов"
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-[13px] text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">
              Роль
            </label>
            <select
              name="role"
              defaultValue="employee"
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-[13px] text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            >
              <option value="employee">Сотрудник</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            <UserPlus size={14} />
            {pending ? 'Создание...' : 'Создать приглашение'}
          </button>
        </div>
      </form>

      {state?.error && (
        <p className="mt-3 text-[13px] text-red-500">{state.error}</p>
      )}

      {state?.success && inviteUrl && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[13px] font-medium text-emerald-700 mb-2">{state.success}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-white border border-emerald-200 px-3 py-1.5 text-[12px] text-slate-600 dark:text-zinc-300 truncate">
              {inviteUrl}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100',
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
