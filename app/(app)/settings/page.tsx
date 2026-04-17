import { Header } from '@/components/layout/header'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { getCategories, getUnits, getCustomFields, getOrderStatuses } from '@/lib/actions/settings-data'
import { isRegistrationAllowed } from '@/lib/actions/settings'
import { getCompanyBranding } from '@/lib/actions/branding'
import { SettingsTabs } from '@/components/settings/settings-tabs'

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
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
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
