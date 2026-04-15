import { Header } from '@/components/layout/header'
import { ProductForm } from '@/components/products/product-form'
import { DeleteProductButton } from '@/components/products/delete-product-button'
import { getProductById, getCategories } from '@/lib/actions/products'
import { getUnits, getCustomFields, getProductCustomValues } from '@/lib/actions/settings-data'
import { requireProfile } from '@/lib/actions/profile'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    redirect('/')
  }

  const [product, categories, units, customFields] = await Promise.all([
    getProductById(id),
    getCategories(),
    getUnits(),
    getCustomFields(),
  ])

  if (!product) {
    notFound()
  }

  const customValuesRaw = await getProductCustomValues(product.id)
  const initialCustomValues: Record<string, string> = {}
  for (const cv of customValuesRaw) {
    initialCustomValues[cv.field_id] = cv.value
  }

  return (
    <>
      <Header title="Редактирование" description={product.sku}>
        <Link
          href={`/catalog/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
      </Header>

      <div className="p-5 max-w-2xl space-y-5">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <ProductForm categories={categories} units={units} customFields={customFields} product={product} initialCustomValues={initialCustomValues} />
        </div>

        {profile.role === 'admin' && (
          <div className="rounded-xl border border-red-200/60 bg-red-50/30 p-5">
            <h3 className="text-[13px] font-semibold text-red-700 mb-1">Опасная зона</h3>
            <p className="text-[12px] text-red-500 mb-3">
              Товар будет снят с продажи (статус «Снят»). Это действие логируется.
            </p>
            <DeleteProductButton productId={product.id} productName={product.name} />
          </div>
        )}
      </div>
    </>
  )
}
