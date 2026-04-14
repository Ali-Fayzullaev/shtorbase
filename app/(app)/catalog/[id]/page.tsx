import { Header } from '@/components/layout/header'
import { ProductCard } from '@/components/products/product-card'
import { ProductAuditLog } from '@/components/products/product-audit-log'
import { ProductImages } from '@/components/products/product-images'
import { getProductById, getProductAuditLogs } from '@/lib/actions/products'
import { getProductImages } from '@/lib/actions/images'
import { getProfile } from '@/lib/actions/profile'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, logs, profile, images] = await Promise.all([
    getProductById(id),
    getProductAuditLogs(id),
    getProfile(),
    getProductImages(id),
  ])

  if (!product) {
    notFound()
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  return (
    <>
      <Header title={product.name} description={product.sku}>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
        {canEdit && (
          <Link
            href={`/catalog/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Pencil size={14} />
            Редактировать
          </Link>
        )}
      </Header>

      <div className="p-5 max-w-3xl space-y-5">
        <ProductCard product={product} />
        <ProductImages productId={id} images={images} canEdit={canEdit} />
        {canEdit && logs.length > 0 && (
          <ProductAuditLog logs={logs} />
        )}
      </div>
    </>
  )
}
