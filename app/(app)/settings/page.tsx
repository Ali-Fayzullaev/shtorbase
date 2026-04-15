import { Header } from '@/components/layout/header'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { getCategories, getUnits, getCustomFields } from '@/lib/actions/settings-data'
import { isRegistrationAllowed } from '@/lib/actions/settings'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')

  const [categories, units, customFields, regAllowed] = await Promise.all([
    getCategories(),
    getUnits(),
    getCustomFields(),
    isRegistrationAllowed(),
  ])

  return (
    <>
      <Header title="Настройки" description="Управление платформой" />
      <div className="p-5">
        <SettingsTabs
          categories={categories}
          units={units}
          customFields={customFields}
          registrationAllowed={regAllowed}
        />
      </div>
    </>
  )
}
