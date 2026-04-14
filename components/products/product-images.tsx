'use client'

import { useState, useTransition } from 'react'
import { uploadProductImage, deleteProductImage, addProductImageUrl } from '@/lib/actions/images'
import { ImagePlus, Trash2, Loader2, Link2 } from 'lucide-react'

interface ProductImage {
  id: string
  storage_path: string | null
  url: string | null
  display_url: string
  sort_order: number
}

interface ProductImagesProps {
  productId: string
  images: ProductImage[]
  canEdit: boolean
}

export function ProductImages({ productId, images, canEdit }: ProductImagesProps) {
  const [uploading, startUpload] = useTransition()
  const [addingUrl, startAddUrl] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')

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

    e.target.value = ''
  }

  const handleAddUrl = () => {
    if (!urlValue.trim()) return
    setError(null)

    startAddUrl(async () => {
      const result = await addProductImageUrl(productId, urlValue.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setUrlValue('')
        setShowUrlInput(false)
      }
    })
  }

  const handleDelete = (img: ProductImage) => {
    setDeletingId(img.id)
    deleteProductImage(img.id, img.storage_path, productId).then((result) => {
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
              src={img.display_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f1f5f9" width="96" height="96"/><text x="48" y="52" text-anchor="middle" fill="%2394a3b8" font-size="12">Ошибка</text></svg>'
              }}
            />
            {img.url && (
              <div className="absolute top-1 left-1">
                <Link2 size={10} className="text-white drop-shadow-md" />
              </div>
            )}
            {canEdit && (
              <button
                onClick={() => handleDelete(img)}
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
          <>
            {/* Upload file */}
            <label className="flex w-24 h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
              {uploading ? (
                <Loader2 size={20} className="text-slate-300 animate-spin" />
              ) : (
                <>
                  <ImagePlus size={20} className="text-slate-300" />
                  <span className="text-[10px] text-slate-400 mt-1">Файл</span>
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

            {/* Add URL */}
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex w-24 h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <Link2 size={20} className="text-slate-300" />
              <span className="text-[10px] text-slate-400 mt-1">URL</span>
            </button>
          </>
        )}
      </div>

      {/* URL input */}
      {showUrlInput && canEdit && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
          />
          <button
            onClick={handleAddUrl}
            disabled={addingUrl || !urlValue.trim()}
            className="rounded-lg bg-indigo-500 px-3 py-2 text-[13px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {addingUrl ? <Loader2 size={14} className="animate-spin" /> : 'Добавить'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[12px] text-red-500">{error}</p>
      )}

      {images.length === 0 && !canEdit && (
        <p className="text-[13px] text-slate-400">Нет фотографий</p>
      )}
    </div>
  )
}
