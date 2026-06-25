import { Header } from '@/components/layout/header'
import { requireProfile } from '@/lib/actions/profile'
import { TelegramSettings } from '@/components/account/telegram-settings'
import { User, Bell } from 'lucide-react'

export default async function AccountPage() {
  const profile = await requireProfile()

  return (
    <>
      <Header title="Профиль" description="Настройки уведомлений и аккаунта" />

      <div className="p-4 sm:p-6 space-y-5 page-enter max-w-xl">
        {/* Who am I */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
              {profile.full_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {profile.role === 'admin'
                  ? 'Администратор'
                  : profile.role === 'manager'
                    ? 'Менеджер'
                    : 'Сотрудник'}
              </p>
              {profile.telegram_chat_id ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  ✓ Telegram подключён
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400 mt-1">Telegram не подключён</p>
              )}
            </div>
          </div>
        </div>

        {/* Telegram section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Telegram уведомления
            </h2>
          </div>
          <TelegramSettings telegramChatId={profile.telegram_chat_id} />
        </div>
      </div>
    </>
  )
}
