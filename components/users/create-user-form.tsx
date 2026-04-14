'use client'

import { useActionState } from 'react'
import { createUserAction, type CreateUserState } from '@/lib/actions/users'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<CreateUserState, FormData>(createUserAction, null)
  const [showPwd, setShowPwd] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-[15px] font-semibold text-slate-800 mb-4">Создать пользователя</h2>

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">ФИО</label>
            <input
              name="full_name"
              required
              placeholder="Иван Иванов"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="user@company.kz"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Пароль</label>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Минимум 8 символов"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Роль</label>
            <select
              name="role"
              defaultValue="employee"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            >
              <option value="employee">Сотрудник</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            <UserPlus size={14} />
            {pending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-600">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] text-emerald-700">
          {state.success}
        </div>
      )}
    </div>
  )
}
