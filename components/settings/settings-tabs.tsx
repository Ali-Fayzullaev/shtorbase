'use client'

import { useState } from 'react'
import { type Category, type Unit, type CustomField, type OrderStatusConfig } from '@/lib/types/database'
import { type CompanyBranding } from '@/lib/actions/branding'
import { cn } from '@/lib/utils'
import { Tags, Ruler, ListChecks, Shield, CircleDot, Palette } from 'lucide-react'
import { CategoriesManager } from './categories-manager'
import { UnitsManager } from './units-manager'
import { CustomFieldsManager } from './custom-fields-manager'
import { OrderStatusesManager } from './order-statuses-manager'
import { BrandingManager } from './branding-manager'
import { RegistrationToggle } from '@/components/users/registration-toggle'

interface SettingsTabsProps {
  categories: Category[]
  units: Unit[]
  customFields: CustomField[]
  orderStatuses: OrderStatusConfig[]
  registrationAllowed: boolean
  branding: CompanyBranding
}

const tabs = [
  {
    id: 'branding',
    label: 'Бренд',
    desc: 'Логотип и название',
    icon: Palette,
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300',
    border: 'border-violet-200/60 dark:border-violet-500/20',
  },
  {
    id: 'categories',
    label: 'Категории',
    desc: 'Группировка товаров',
    icon: Tags,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300',
    border: 'border-indigo-200/60 dark:border-indigo-500/20',
  },
  {
    id: 'units',
    label: 'Единицы',
    desc: 'м, шт, рулон…',
    icon: Ruler,
    color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300',
    border: 'border-sky-200/60 dark:border-sky-500/20',
  },
  {
    id: 'fields',
    label: 'Доп. поля',
    desc: 'Свои атрибуты товаров',
    icon: ListChecks,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-500/20',
  },
  {
    id: 'statuses',
    label: 'Статусы',
    desc: 'Этапы заказов',
    icon: CircleDot,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300',
    border: 'border-amber-200/60 dark:border-amber-500/20',
  },
  {
    id: 'general',
    label: 'Доступ',
    desc: 'Регистрация пользователей',
    icon: Shield,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300',
    border: 'border-rose-200/60 dark:border-rose-500/20',
  },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsTabs({ categories, units, customFields, orderStatuses, registrationAllowed, branding }: SettingsTabsProps) {
  const [tab, setTab] = useState<TabId>('branding')
  const active = tabs.find((t) => t.id === tab)!

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      {/* Sidebar nav */}
      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible rounded-2xl border border-zinc-200/70 bg-white/80 p-2 dark:border-white/[0.06] dark:bg-zinc-900/60">
        {tabs.map((t) => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                'lg:w-full',
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 shadow-sm'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
              )}
            >
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', t.color, t.border)}>
                <t.icon size={15} />
              </div>
              <div className="hidden lg:block min-w-0">
                <div className={cn('text-[13px] font-semibold leading-tight', isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400')}>
                  {t.label}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">{t.desc}</div>
              </div>
              {/* Mobile: just label */}
              <span className={cn('text-[12px] font-medium lg:hidden whitespace-nowrap', isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400')}>
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Content area */}
      <div className="min-w-0">
        {/* Section header */}
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', active.color, active.border)}>
            <active.icon size={16} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{active.label}</h2>
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500 leading-tight">{active.desc}</p>
          </div>
        </div>

        {tab === 'branding' && <BrandingManager initial={branding} />}
        {tab === 'categories' && <CategoriesManager initial={categories} />}
        {tab === 'units' && <UnitsManager initial={units} />}
        {tab === 'fields' && <CustomFieldsManager initial={customFields} />}
        {tab === 'statuses' && <OrderStatusesManager initial={orderStatuses} />}
        {tab === 'general' && (
          <div className="max-w-xl space-y-5">
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                  <Shield size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Регистрация новых пользователей</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Когда включено — любой посетитель может создать учётную запись по приглашению.
                  </p>
                </div>
              </div>
              <RegistrationToggle allowed={registrationAllowed} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

