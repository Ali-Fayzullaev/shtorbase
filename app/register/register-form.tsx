'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, UserPlus, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react'
import { registerAction, type RegisterState } from '@/lib/actions/register'
import Link from 'next/link'

export function RegisterForm() {
  const [showPwd, setShowPwd] = useState(false)
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(registerAction, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <Field label="ФИО" error={state?.fieldErrors?.full_name}>
        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          name="full_name"
          required
          autoComplete="name"
          placeholder="Иван Иванов"
          className={inputCls}
        />
      </Field>

      <Field label="Email">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@company.kz"
          className={inputCls}
        />
      </Field>

      <Field label="Телефон" error={state?.fieldErrors?.phone}>
        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+77001234567"
          className={inputCls}
        />
      </Field>

      <Field label="Пароль" error={state?.fieldErrors?.password}>
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type={showPwd ? 'text' : 'password'}
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Минимум 8 символов"
          className={inputCls + ' pr-11'}
        />
        <button
          type="button"
          onClick={() => setShowPwd(!showPwd)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </Field>

      <Field label="Подтвердите пароль" error={state?.fieldErrors?.password_confirm}>
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type={showPwd ? 'text' : 'password'}
          name="password_confirm"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Повторите пароль"
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        {isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            <UserPlus size={16} />
            Создать аккаунт
          </>
        )}
      </button>

      <p className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Войти
        </Link>
      </p>
    </form>
  )
}

const inputCls =
  'w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
