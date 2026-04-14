'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { acceptInviteAction, type AcceptInviteState } from '@/lib/actions/accept-invite'
import { use } from 'react'

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState<AcceptInviteState, FormData>(acceptInviteAction, null)

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold mb-4 shadow-lg shadow-primary/25">
          Ш
        </div>
        <h1 className="text-2xl font-bold text-foreground">ШторБаза</h1>
        <p className="text-sm text-muted mt-1">Создайте пароль для входа в систему</p>
      </div>

      {/* Form */}
      <form
        action={formAction}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <input type="hidden" name="token" value={token} />

        {state?.error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Подтвердите пароль
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password_confirm"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Повторите пароль"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
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
              Создать аккаунт
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted mt-6">
        Регистрация доступна только по приглашению
      </p>
    </div>
  )
}
