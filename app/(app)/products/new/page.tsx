import { Header } from '@/components/layout/header'
import { ProductForm } from '@/components/products/product-form'
import { getCategories } from '@/lib/actions/products'
import { getUnits, getCustomFields } from '@/lib/actions/settings-data'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PackagePlus, Info, Sparkles, Keyboard } from 'lucide-react'

export default async function NewProductPage() {
  const profile = await requireProfile()

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    redirect('/')
  }

  const [categories, units, customFields] = await Promise.all([
    getCategories(),
    getUnits(),
    getCustomFields(),
  ])

  return (
    <>
      <Header title="Новый товар" description="Добавление позиции в каталог">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 px-3 py-1.5 text-[13px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
      </Header>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
          {/* Main form */}
          <div className="glass-card rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
                <PackagePlus size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100">Карточка товара</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Заполните обязательные поля. Фотографии можно добавить позже.
                </p>
              </div>
            </div>
            <ProductForm categories={categories} units={units} customFields={customFields} />
          </div>

          {/* Help sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <TipCard
              icon={Info}
              tone="indigo"
              title="Уникальный артикул"
              text="SKU должен быть уникальным в рамках каталога. Используйте префикс категории, например SH-0001."
            />
            <TipCard
              icon={Sparkles}
              tone="emerald"
              title="Профессиональные фото"
              text="Загружайте изображения с нейтральным фоном, соотношением 4:3. При наведении покупатель увидит все фото."
            />
            <TipCard
              icon={Keyboard}
              tone="amber"
              title="Горячие клавиши"
              text="Нажмите «?» для списка сокращений. «n» создаст новый товар из любой страницы."
            />
          </aside>
        </div>
      </div>
    </>
  )
}

const toneStyles: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-500 shadow-indigo-500/20',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
  amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
}

function TipCard({ icon: Icon, tone, title, text }: { icon: typeof Info; tone: string; title: string; text: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${toneStyles[tone]} text-white shadow-md`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  )
}
