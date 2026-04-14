import { Header } from '@/components/layout/header'
import { ProductCard } from '@/components/products/product-card'
import { demoProducts } from '@/lib/demo-data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = demoProducts.find((p) => p.id === id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header title={product.name} description={`Артикул: ${product.sku}`}>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/20 transition-all"
        >
          <ArrowLeft size={16} />
          Назад
        </Link>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
          <Pencil size={16} />
          Редактировать
        </button>
      </Header>

      <div className="p-6 max-w-2xl">
        <ProductCard product={product} />
      </div>
    </>
  )
}
