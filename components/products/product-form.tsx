'use client'

import { useActionState, useState } from 'react'
import { type Product, type Category } from '@/lib/types/database'
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon, Loader2 } from 'lucide-react'

interface ProductFormProps {
  categories: Category[]
  product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const isEdit = !!product
  const action = isEdit ? updateProductAction : createProductAction
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, null)
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [vatIncluded, setVatIncluded] = useState(product?.vat_included ?? true)

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="product_id" value={product.id} />}
      {/* Hidden input for checkbox — base-ui Checkbox doesn't submit via FormData */}
      <input type="hidden" name="vat_included" value={vatIncluded ? 'on' : ''} />

      {state?.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* SKU + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">Артикул</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku}
            placeholder="SH-0001"
            className={cn('font-mono', state?.fieldErrors?.sku && 'border-destructive')}
          />
          {state?.fieldErrors?.sku && (
            <p className="text-xs text-destructive">{state.fieldErrors.sku}</p>
          )}
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="name">Название</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            placeholder="Штора «Венеция» бархат"
            className={cn(state?.fieldErrors?.name && 'border-destructive')}
          />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          )}
        </div>
      </div>

      {/* Category + Unit — native <select> for FormData compatibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_id">Категория</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ''}
            className={cn(
              'flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              state?.fieldErrors?.category_id && 'border-destructive ring-3 ring-destructive/20'
            )}
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.category_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.category_id}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Единица измерения</Label>
          <select
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? ''}
            disabled={isEdit}
            className={cn(
              'flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              state?.fieldErrors?.unit && 'border-destructive ring-3 ring-destructive/20',
              isEdit && 'opacity-50 cursor-not-allowed'
            )}
          >
            <option value="">Выберите</option>
            <option value="meter">Метр</option>
            <option value="piece">Штука</option>
          </select>
          {isEdit && (
            <p className="text-xs text-muted-foreground">Нельзя изменить после создания</p>
          )}
          {state?.fieldErrors?.unit && (
            <p className="text-xs text-destructive">{state.fieldErrors.unit}</p>
          )}
        </div>
      </div>

      {/* Price + Stock + VAT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена, ₸</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price?.toString()}
            placeholder="4500"
            className={cn(state?.fieldErrors?.price && 'border-destructive')}
          />
          {state?.fieldErrors?.price && (
            <p className="text-xs text-destructive">{state.fieldErrors.price}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Остаток</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            step="0.1"
            min="0"
            defaultValue={product?.stock?.toString()}
            placeholder="100"
            className={cn(state?.fieldErrors?.stock && 'border-destructive')}
          />
          {state?.fieldErrors?.stock && (
            <p className="text-xs text-destructive">{state.fieldErrors.stock}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>НДС</Label>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="vat_included"
              checked={vatIncluded}
              onCheckedChange={(checked) => setVatIncluded(checked === true)}
            />
            <Label htmlFor="vat_included" className="text-sm font-normal cursor-pointer">
              Цена включает НДС
            </Label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ''}
          placeholder="Краткое описание товара..."
          className="min-h-20 resize-none"
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Заметка для сотрудников</Label>
        <Input
          id="note"
          name="note"
          defaultValue={product?.note ?? ''}
          placeholder="Например: «Режется от 1 м, шаг 0.5 м»"
          className={cn(state?.fieldErrors?.note && 'border-destructive')}
        />
        {state?.fieldErrors?.note && (
          <p className="text-xs text-destructive">{state.fieldErrors.note}</p>
        )}
      </div>

      {/* Image URLs (only for creation) */}
      {!isEdit && (
        <div className="space-y-3">
          <Label className="gap-1.5">
            <ImageIcon size={14} />
            Изображения (URL)
          </Label>
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  name="image_urls"
                  value={url}
                  onChange={(e) => {
                    const next = [...imageUrls]
                    next[i] = e.target.value
                    setImageUrls(next)
                  }}
                  placeholder="https://example.com/photo.jpg"
                />
                {imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageUrls([...imageUrls, ''])}
          >
            <Plus size={14} />
            Добавить ещё
          </Button>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Сохранить' : 'Создать товар'}
        </Button>
      </div>
    </form>
  )
}
