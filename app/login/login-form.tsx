'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { loginAction, type AuthState } from '@/lib/actions/auth'
import Link from 'next/link'

interface LoginFormProps {
  showRegister: boolean
}

export function LoginForm({ showRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(loginAction, null)

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold mb-4 shadow-lg shadow-primary/25">
          Ш
        </div>
        <h1 className="text-2xl font-bold text-foreground">ШторБаза</h1>
        <p className="text-sm text-muted mt-1">Войдите для доступа к системе</p>
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

        {/* Honeypot — скрыто от людей, заполнится только ботами */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
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
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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
              <LogIn size={16} />
              Войти
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted mt-6">
        {showRegister ? (
          <>
            <Link href="/register" className="font-medium text-primary hover:underline">
              Регистрация
            </Link>
            {' · '}
          </>
        ) : null}
        Доступ через администратора
      </p>
    </div>
  )
}
