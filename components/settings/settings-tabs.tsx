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
  { id: 'branding', label: 'Бренд', icon: Palette },
  { id: 'categories', label: 'Категории', icon: Tags },
  { id: 'units', label: 'Единицы', icon: Ruler },
  { id: 'fields', label: 'Доп. поля', icon: ListChecks },
  { id: 'statuses', label: 'Статусы', icon: CircleDot },
  { id: 'general', label: 'Доступ', icon: Shield },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsTabs({ categories, units, customFields, orderStatuses, registrationAllowed, branding }: SettingsTabsProps) {
  const [tab, setTab] = useState<TabId>('branding')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 max-w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
              tab === t.id
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
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
  )
}
