import { Header } from '@/components/layout/header'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { getCategories, getUnits, getCustomFields, getOrderStatuses } from '@/lib/actions/settings-data'
import { isRegistrationAllowed } from '@/lib/actions/settings'
import { getCompanyBranding } from '@/lib/actions/branding'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { Settings2, Tags, Ruler, ListChecks, CircleDot, Shield, Palette } from 'lucide-react'

export default async function SettingsPage() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')

  const [categories, units, customFields, orderStatuses, regAllowed, branding] = await Promise.all([
    getCategories(),
    getUnits(),
    getCustomFields(),
    getOrderStatuses(),
    isRegistrationAllowed(),
    getCompanyBranding(),
  ])

  return (
    <>
      <Header title="Настройки" description="Управление платформой" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Hero */}
        <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-white/[0.06] dark:from-zinc-950 dark:to-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Settings2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Администраторам</div>
              <h2 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">Настройка под ваш бизнес</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Здесь хранятся все справочники и поведенческие настройки системы. Изменения применяются сразу по всему приложению.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { icon: Palette, label: 'Бренд', desc: 'Лого и название компании' },
                  { icon: Tags, label: 'Категории', desc: 'Для группировки товаров' },
                  { icon: Ruler, label: 'Единицы', desc: 'м, шт, рулон...' },
                  { icon: ListChecks, label: 'Доп. поля', desc: 'Свои атрибуты товаров' },
                  { icon: CircleDot, label: 'Статусы', desc: 'Этапы заказов' },
                  { icon: Shield, label: 'Доступ', desc: 'Регистрация' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
                    <Icon size={11} className="text-indigo-400" />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
                    <span className="text-zinc-400">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SettingsTabs
          categories={categories}
          units={units}
          customFields={customFields}
          orderStatuses={orderStatuses}
          registrationAllowed={regAllowed}
          branding={branding}
        />
      </div>
    </>
  )
}
