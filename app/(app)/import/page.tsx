import { Header } from '@/components/layout/header'
import { ImportForm } from '@/components/import/import-form'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'

export default async function ImportPage() {
  const profile = await requireProfile()
  if (!['manager', 'admin'].includes(profile.role)) redirect('/')

  return (
    <>
      <Header title="Импорт остатков" description="Массовое обновление из CSV" />

      <div className="p-5 max-w-2xl">
        <ImportForm />
      </div>
    </>
  )
}
