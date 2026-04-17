'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { loginAction, type AuthState } from '@/lib/actions/auth'
import Link from 'next/link'

interface LoginFormProps {
  showRegister: boolean
}

export function LoginForm({ showRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(loginAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Field label="Email">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@company.kz"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
        />
      </Field>

      <Field label="Пароль">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          required
          minLength={8}
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-11 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        {isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            <LogIn size={16} />
            Войти в систему
          </>
        )}
      </button>

      {showRegister && (
        <>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-zinc-50 dark:bg-zinc-950 px-3 text-zinc-400">или</span>
            </div>
          </div>
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Создать аккаунт
          </Link>
        </>
      )}

      <p className="pt-2 text-center text-xs text-zinc-400">
        Нет доступа? Обратитесь к администратору
      </p>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">{children}</div>
    </div>
  )
}
