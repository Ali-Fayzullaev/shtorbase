'use client'

import { useTransition } from 'react'
import { updateAppSetting } from '@/lib/actions/settings'
import { Shield, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils/format'

interface RegistrationToggleProps {
  allowed: boolean
}

export function RegistrationToggle({ allowed }: RegistrationToggleProps) {
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      await updateAppSetting('allow_registration', !allowed)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {allowed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Shield size={16} className="text-emerald-600" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <ShieldOff size={16} className="text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-[13px] font-medium text-slate-800">Открытая регистрация</p>
            <p className="text-[12px] text-slate-400">
              {allowed
                ? 'Сотрудники могут зарегистрироваться самостоятельно'
                : 'Только администратор может создавать аккаунты'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
            allowed ? 'bg-emerald-500' : 'bg-slate-300',
            pending && 'opacity-50',
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
              allowed ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </div>
    </div>
  )
}
