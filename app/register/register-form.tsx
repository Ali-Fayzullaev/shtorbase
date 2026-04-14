'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { registerAction, type RegisterState } from '@/lib/actions/register'
import Link from 'next/link'

export function RegisterForm() {
  const [showPwd, setShowPwd] = useState(false)
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(registerAction, null)

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold mb-4 shadow-lg shadow-primary/25">
          Ш
        </div>
        <h1 className="text-2xl font-bold text-foreground">ШторБаза</h1>
        <p className="text-sm text-muted mt-1">Регистрация нового сотрудника</p>
      </div>

      <form
        action={formAction}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        {state?.error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">ФИО</label>
          <input
            name="full_name"
            required
            autoComplete="name"
            placeholder="Иван Иванов"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.fieldErrors?.full_name && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.full_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="name@company.kz"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Пароль</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Подтвердите пароль</label>
          <input
            type={showPwd ? 'text' : 'password'}
            name="password_confirm"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Повторите пароль"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.fieldErrors?.password_confirm && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.password_confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm shadow-primary/20"
        >
          {isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <UserPlus size={16} />
              Зарегистрироваться
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
