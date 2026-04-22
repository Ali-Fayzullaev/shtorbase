import { Header } from '@/components/layout/header'
import { ImportForm } from '@/components/import/import-form'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { FileSpreadsheet, ShieldCheck, Workflow } from 'lucide-react'

export default async function ImportPage() {
  const profile = await requireProfile()
  if (!['manager', 'admin'].includes(profile.role)) redirect('/')

  return (
    <>
      <Header title="Импорт остатков" description="Массовое обновление из CSV" />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
          <ImportForm />

          <aside className="space-y-4 lg:sticky lg:top-20">
            <InfoCard
              icon={FileSpreadsheet}
              title="Для кого этот экран"
              text="Используйте импорт для массового обновления остатков после инвентаризации, прихода товара или синхронизации с поставщиком."
            />
            <InfoCard
              icon={Workflow}
              title="Что происходит после загрузки"
              text="Система находит товары по SKU, обновляет остаток только у совпавших позиций и отдельно показывает артикулы, которых нет в каталоге."
            />
            <InfoCard
              icon={ShieldCheck}
              title="Как снизить ошибки"
              text="Перед загрузкой экспортируйте актуальный список SKU из каталога и используйте его как основу для CSV — так меньше риск не найденных артикулов."
            />
          </aside>
        </div>
      </div>
    </>
  )
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof FileSpreadsheet; title: string; text: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">{title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">{text}</p>
        </div>
      </div>
    </div>
  )
}
