import { Header } from '@/components/layout/header'
import { ProductCard } from '@/components/products/product-card'
import { ProductImages } from '@/components/products/product-images'
import { ProductVariants } from '@/components/products/product-variants'
import { getProductById, getProductVariants } from '@/lib/actions/products'
import { getProductImages } from '@/lib/actions/images'
import { requireProfile } from '@/lib/actions/profile'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Каталог — только просмотр товара для оформления заказа. Редактирование,
// добавление вариаций и управление фото происходит на странице /products.
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()
  if (profile.role === 'employee') {
    redirect('/')
  }

  const [product, images] = await Promise.all([
    getProductById(id),
    getProductImages(id),
  ])

  if (!product) {
    notFound()
  }

  const variants = product.variant_group_id ? await getProductVariants(product.variant_group_id, product.id) : []

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
      </Header>

      <div className="p-5 max-w-3xl space-y-5">
        <ProductCard product={product} />
        <ProductImages productId={id} images={images} canEdit={false} />
        <ProductVariants variants={variants} sourceProductId={product.id} canEdit={false} />
      </div>
    </>
  )
}
