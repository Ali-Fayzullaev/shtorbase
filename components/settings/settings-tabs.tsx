'use client'

import { useState } from 'react'
import { type Category, type Unit, type CustomField } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Tags, Ruler, ListChecks, Shield } from 'lucide-react'
import { CategoriesManager } from './categories-manager'
import { UnitsManager } from './units-manager'
import { CustomFieldsManager } from './custom-fields-manager'
import { RegistrationToggle } from '@/components/users/registration-toggle'

interface SettingsTabsProps {
  categories: Category[]
  units: Unit[]
  customFields: CustomField[]
  registrationAllowed: boolean
}

const tabs = [
  { id: 'categories', label: 'Категории', icon: Tags },
  { id: 'units', label: 'Единицы', icon: Ruler },
  { id: 'fields', label: 'Доп. поля', icon: ListChecks },
  { id: 'general', label: 'Общее', icon: Shield },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsTabs({ categories, units, customFields, registrationAllowed }: SettingsTabsProps) {
  const [tab, setTab] = useState<TabId>('categories')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 max-w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all',
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
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
      {tab === 'general' && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Регистрация</h3>
            <RegistrationToggle initialAllowed={registrationAllowed} />
          </div>
        </div>
      )}
    </div>
  )
}
