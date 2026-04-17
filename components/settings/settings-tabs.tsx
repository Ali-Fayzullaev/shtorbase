'use client'

import { useState } from 'react'
import { type Category, type Unit, type CustomField, type OrderStatusConfig } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Tags, Ruler, ListChecks, Shield, CircleDot } from 'lucide-react'
import { CategoriesManager } from './categories-manager'
import { UnitsManager } from './units-manager'
import { CustomFieldsManager } from './custom-fields-manager'
import { OrderStatusesManager } from './order-statuses-manager'
import { RegistrationToggle } from '@/components/users/registration-toggle'

interface SettingsTabsProps {
  categories: Category[]
  units: Unit[]
  customFields: CustomField[]
  orderStatuses: OrderStatusConfig[]
  registrationAllowed: boolean
}

const tabs = [
  { id: 'categories', label: 'Категории', icon: Tags },
  { id: 'units', label: 'Единицы', icon: Ruler },
  { id: 'fields', label: 'Доп. поля', icon: ListChecks },
  { id: 'statuses', label: 'Статусы', icon: CircleDot },
  { id: 'general', label: 'Общее', icon: Shield },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsTabs({ categories, units, customFields, orderStatuses, registrationAllowed }: SettingsTabsProps) {
  const [tab, setTab] = useState<TabId>('categories')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 max-w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap',
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
      {tab === 'categories' && <CategoriesManager initial={categories} />}
      {tab === 'units' && <UnitsManager initial={units} />}
      {tab === 'fields' && <CustomFieldsManager initial={customFields} />}
      {tab === 'statuses' && <OrderStatusesManager initial={orderStatuses} />}
      {tab === 'general' && (
        <div className="max-w-lg space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">Регистрация</h3>
            <RegistrationToggle allowed={registrationAllowed} />
          </div>
        </div>
      )}
    </div>
  )
}
