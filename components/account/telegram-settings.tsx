'use client'

import React, { useActionState, useEffect, useRef } from 'react'
import { saveTelegramId } from '@/lib/actions/profile-mutations'
import { Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

interface TelegramSettingsProps {
  telegramChatId: string | null
}

export function TelegramSettings({ telegramChatId }: TelegramSettingsProps) {
  const [state, action, pending] = useActionState(saveTelegramId, null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success && inputRef.current) {
      inputRef.current.blur()
    }
  }, [state])

  return (
    <div className="space-y-5">
      {/* How to find ID */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/20">
            <Send size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Уведомления в Telegram
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Получай личные уведомления о своих заказах прямо в Telegram.
            </p>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-500/20 p-4 space-y-3">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
            Как подключить — 3 шага
          </p>
          <ol className="space-y-3">
            {([
              <>
                Открой нашего бота{' '}
                <a
                  href="https://t.me/shtorbase_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  @shtorbase_bot
                  <ExternalLink size={11} />
                </a>{' '}
                и нажми <span className="font-bold">Старт</span>. Это обязательный шаг — по правилам Telegram бот не может написать тебе первым, пока ты сам не начал с ним диалог.
              </>,
              <>
                Бот должен ответить твоим ID. Если ответа нет — открой{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  @userinfobot
                  <ExternalLink size={11} />
                </a>{' '}
                и нажми <span className="font-bold">Старт</span> — он мгновенно пришлёт твой ID в поле «Id».
              </>,
              'Скопируй число (только цифры, без @ и букв) и вставь в поле ниже',
            ] as React.ReactNode[]).map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-[10px] font-bold mt-px">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Input form */}
      <div className="glass-card rounded-2xl p-5">
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="telegram_chat_id"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
            >
              Твой Telegram ID
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="telegram_chat_id"
                name="telegram_chat_id"
                type="text"
                inputMode="numeric"
                defaultValue={telegramChatId ?? ''}
                placeholder="например: 123456789"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Только числа. Оставь пустым, чтобы отключить личные уведомления.
            </p>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 px-4 py-3">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
            </div>
          )}

          {state?.success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Сохранено! Уведомления подключены.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-press w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
          >
            {pending ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
