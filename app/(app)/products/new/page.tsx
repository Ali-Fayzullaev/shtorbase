import { Header } from '@/components/layout/header'
import { ProductForm } from '@/components/products/product-form'
import { getCategories } from '@/lib/actions/products'
import { getUnits, getCustomFields } from '@/lib/actions/settings-data'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
      <Header title="Новый товар">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
      </Header>

      <div className="p-5 max-w-2xl">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <ProductForm categories={categories} units={units} customFields={customFields} />
        </div>
      </div>
    </>
  )
}
