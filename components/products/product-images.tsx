'use client'

import { useState, useTransition } from 'react'
import { uploadProductImage, deleteProductImage } from '@/lib/actions/images'
import { ImagePlus, Trash2, Loader2 } from 'lucide-react'

function getImageUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`
}

interface ProductImage {
  id: string
  storage_path: string
  sort_order: number
}

interface ProductImagesProps {
  productId: string
  images: ProductImage[]
  canEdit: boolean
}

export function ProductImages({ productId, images, canEdit }: ProductImagesProps) {
  const [uploading, startUpload] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    const formData = new FormData()
    formData.append('image', file)

    startUpload(async () => {
      const result = await uploadProductImage(productId, formData)
      if (result.error) setError(result.error)
    })

    // Reset input
    e.target.value = ''
  }

  const handleDelete = (imageId: string, storagePath: string) => {
    setDeletingId(imageId)
    deleteProductImage(imageId, storagePath, productId).then((result) => {
      if (result.error) setError(result.error)
      setDeletingId(null)
    })
  }

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Фотографии</h3>

      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={getImageUrl(img.storage_path)}
              alt=""
              className="w-full h-full object-cover"
            />
            {canEdit && (
              <button
                onClick={() => handleDelete(img.id, img.storage_path)}
                disabled={deletingId === img.id}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deletingId === img.id ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <Trash2 size={16} className="text-white" />
                )}
              </button>
            )}
          </div>
        ))}

        {canEdit && (
          <label className="flex w-24 h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            {uploading ? (
              <Loader2 size={20} className="text-slate-300 animate-spin" />
            ) : (
              <>
                <ImagePlus size={20} className="text-slate-300" />
                <span className="text-[10px] text-slate-400 mt-1">Добавить</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[12px] text-red-500">{error}</p>
      )}

      {images.length === 0 && !canEdit && (
        <p className="text-[13px] text-slate-400">Нет фотографий</p>
      )}
    </div>
  )
}
