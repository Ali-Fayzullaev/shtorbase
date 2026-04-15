'use client'

import { useActionState, useState, useRef } from 'react'
import { type Product, type Category, type Unit, type CustomField } from '@/lib/types/database'
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon, Loader2, Upload } from 'lucide-react'

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
const labelCls = 'text-sm font-medium leading-none'
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
const btnPrimaryCls =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50'
const btnOutlineCls =
  'inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
const btnGhostCls =
  'inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-sm transition-colors hover:bg-muted hover:text-foreground'
const errCls = 'border-destructive focus-visible:ring-destructive/30'

interface ProductFormProps {
  categories: Category[]
  units: Unit[]
  customFields: CustomField[]
  product?: Product
  initialCustomValues?: Record<string, string>
}

export function ProductForm({ categories, units, customFields, product, initialCustomValues }: ProductFormProps) {
  const isEdit = !!product
  const action = isEdit ? updateProductAction : createProductAction
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, null)
  const [sku, setSku] = useState(product?.sku ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [note, setNote] = useState(product?.note ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [vatIncluded, setVatIncluded] = useState(product?.vat_included ?? true)
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [unit, setUnit] = useState(product?.unit ?? '')
  const [customValues, setCustomValues] = useState<Record<string, string>>(initialCustomValues ?? {})
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      {product && <input type="hidden" name="product_id" value={product.id} />}
      <input type="hidden" name="vat_included" value={vatIncluded ? 'on' : ''} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="unit" value={unit} />
      {/* Hidden custom field values */}
      {customFields.map((field) => (
        <input key={field.id} type="hidden" name={`cf_${field.id}`} value={customValues[field.id] ?? ''} />
      ))}

      {state?.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* SKU + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="sku" className={labelCls}>Артикул</label>
          <input
            id="sku" name="sku" type="text"
            value={sku} onChange={(e) => setSku(e.target.value)}
            placeholder="SH-0001"
            className={cn(inputCls, 'font-mono', state?.fieldErrors?.sku && errCls)}
          />
          {state?.fieldErrors?.sku && <p className="text-xs text-destructive">{state.fieldErrors.sku}</p>}
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label htmlFor="name" className={labelCls}>Название</label>
          <input
            id="name" name="name" type="text"
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Штора «Венеция» бархат"
            className={cn(inputCls, state?.fieldErrors?.name && errCls)}
          />
          {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
        </div>
      </div>

      {/* Category + Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="category_id" className={labelCls}>Категория</label>
          <select
            id="category_id" value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={cn(selectCls, state?.fieldErrors?.category_id && errCls)}
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {state?.fieldErrors?.category_id && <p className="text-xs text-destructive">{state.fieldErrors.category_id}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="unit" className={labelCls}>Единица измерения</label>
          <select
            id="unit" value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={isEdit}
            className={cn(selectCls, state?.fieldErrors?.unit && errCls, isEdit && 'opacity-50 cursor-not-allowed')}
          >
            <option value="">Выберите</option>
            {units.map((u) => (
              <option key={u.id} value={u.short_name}>{u.name} ({u.short_name})</option>
            ))}
          </select>
          {isEdit && <p className="text-xs text-muted-foreground">Нельзя изменить после создания</p>}
          {state?.fieldErrors?.unit && <p className="text-xs text-destructive">{state.fieldErrors.unit}</p>}
        </div>
      </div>

      {/* Price + Stock + VAT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className={labelCls}>Цена</label>
          <input
            id="price" name="price" type="number" step="0.01" min="0"
            value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="4500"
            className={cn(inputCls, state?.fieldErrors?.price && errCls)}
          />
          {state?.fieldErrors?.price && <p className="text-xs text-destructive">{state.fieldErrors.price}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="stock" className={labelCls}>Остаток</label>
          <input
            id="stock" name="stock" type="number" step="0.1" min="0"
            value={stock} onChange={(e) => setStock(e.target.value)}
            placeholder="100"
            className={cn(inputCls, state?.fieldErrors?.stock && errCls)}
          />
          {state?.fieldErrors?.stock && <p className="text-xs text-destructive">{state.fieldErrors.stock}</p>}
        </div>
        <div className="space-y-2">
          <span className={labelCls}>НДС</span>
          <label className="flex items-center gap-2 pt-1.5 cursor-pointer">
            <input
              type="checkbox" checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary accent-primary"
            />
            <span className="text-sm text-foreground">Цена включает НДС</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className={labelCls}>Описание</label>
        <textarea
          id="description" name="description" rows={3}
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание товара..."
          className={cn(inputCls, 'min-h-20 resize-none py-2')}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label htmlFor="note" className={labelCls}>Заметка для сотрудников</label>
        <input
          id="note" name="note" type="text"
          value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Например: Режется от 1 м, шаг 0.5 м"
          className={cn(inputCls, state?.fieldErrors?.note && errCls)}
        />
        {state?.fieldErrors?.note && <p className="text-xs text-destructive">{state.fieldErrors.note}</p>}
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="space-y-3">
          <span className={cn(labelCls, 'text-slate-600')}>Дополнительные поля</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  {field.name}
                  {field.is_required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {field.field_type === 'select' && field.options ? (
                  <select
                    value={customValues[field.id] ?? ''}
                    onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                    className={selectCls}
                  >
                    <option value="">Выберите...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    value={customValues[field.id] ?? ''}
                    onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                    placeholder={field.name}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images (only for creation) */}
      {!isEdit && (
        <div className="space-y-3">
          <span className={cn(labelCls, 'flex items-center gap-1.5')}>
            <ImageIcon size={14} />
            Изображения
          </span>

          {/* File upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              name="image_files"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(btnOutlineCls, 'h-9 px-3 gap-1.5 w-full justify-center border-dashed')}
            >
              <Upload size={14} />
              Загрузить с устройства
            </button>
            {imageFiles.length > 0 && (
              <ul className="space-y-1">
                {imageFiles.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                    <ImageIcon size={12} className="text-slate-400 shrink-0" />
                    <span className="flex-1 truncate text-slate-600">{file.name}</span>
                    <span className="text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* URL inputs */}
          <p className="text-xs text-slate-400">Или добавьте по ссылке:</p>
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="image_urls" type="url" value={url}
                  onChange={(e) => {
                    const next = [...imageUrls]
                    next[i] = e.target.value
                    setImageUrls(next)
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className={inputCls}
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    className={cn(btnOutlineCls, 'h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive')}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setImageUrls([...imageUrls, ''])}
            className={btnGhostCls}
          >
            <Plus size={14} />
            Добавить ещё
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className={btnPrimaryCls}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Сохранить' : 'Создать товар'}
        </button>
      </div>
    </form>
  )
}
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon, Loader2 } from 'lucide-react'

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
const labelCls = 'text-sm font-medium leading-none'
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
const btnPrimaryCls =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50'
const btnOutlineCls =
  'inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
const btnGhostCls =
  'inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-sm transition-colors hover:bg-muted hover:text-foreground'
const errCls = 'border-destructive focus-visible:ring-destructive/30'

interface ProductFormProps {
  categories: Category[]
  product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const isEdit = !!product
  const action = isEdit ? updateProductAction : createProductAction
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, null)
  const [sku, setSku] = useState(product?.sku ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [note, setNote] = useState(product?.note ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [vatIncluded, setVatIncluded] = useState(product?.vat_included ?? true)
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [unit, setUnit] = useState(product?.unit ?? '')

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="product_id" value={product.id} />}
      <input type="hidden" name="vat_included" value={vatIncluded ? 'on' : ''} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="unit" value={unit} />

      {state?.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* SKU + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="sku" className={labelCls}>Артикул</label>
          <input
            id="sku"
            name="sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SH-0001"
            className={cn(inputCls, 'font-mono', state?.fieldErrors?.sku && errCls)}
          />
          {state?.fieldErrors?.sku && (
            <p className="text-xs text-destructive">{state.fieldErrors.sku}</p>
          )}
        </div>
        <div className="sm:col-span-2 space-y-2">
          <label htmlFor="name" className={labelCls}>Название</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Штора «Венеция» бархат"
            className={cn(inputCls, state?.fieldErrors?.name && errCls)}
          />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          )}
        </div>
      </div>

      {/* Category + Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="category_id" className={labelCls}>Категория</label>
          <select
            id="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={cn(selectCls, state?.fieldErrors?.category_id && errCls)}
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {state?.fieldErrors?.category_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.category_id}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="unit" className={labelCls}>Единица измерения</label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={isEdit}
            className={cn(selectCls, state?.fieldErrors?.unit && errCls, isEdit && 'opacity-50 cursor-not-allowed')}
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
          <label htmlFor="price" className={labelCls}>Цена</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="4500"
            className={cn(inputCls, state?.fieldErrors?.price && errCls)}
          />
          {state?.fieldErrors?.price && (
            <p className="text-xs text-destructive">{state.fieldErrors.price}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="stock" className={labelCls}>Остаток</label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="0.1"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="100"
            className={cn(inputCls, state?.fieldErrors?.stock && errCls)}
          />
          {state?.fieldErrors?.stock && (
            <p className="text-xs text-destructive">{state.fieldErrors.stock}</p>
          )}
        </div>
        <div className="space-y-2">
          <span className={labelCls}>НДС</span>
          <label className="flex items-center gap-2 pt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary accent-primary"
            />
            <span className="text-sm text-foreground">Цена включает НДС</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className={labelCls}>Описание</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание товара..."
          className={cn(inputCls, 'min-h-20 resize-none py-2')}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label htmlFor="note" className={labelCls}>Заметка для сотрудников</label>
        <input
          id="note"
          name="note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: Режется от 1 м, шаг 0.5 м"
          className={cn(inputCls, state?.fieldErrors?.note && errCls)}
        />
        {state?.fieldErrors?.note && (
          <p className="text-xs text-destructive">{state.fieldErrors.note}</p>
        )}
      </div>

      {/* Image URLs (only for creation) */}
      {!isEdit && (
        <div className="space-y-3">
          <span className={cn(labelCls, 'flex items-center gap-1.5')}>
            <ImageIcon size={14} />
            Изображения (URL)
          </span>
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="image_urls"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const next = [...imageUrls]
                    next[i] = e.target.value
                    setImageUrls(next)
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className={inputCls}
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    className={cn(btnOutlineCls, 'h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive')}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setImageUrls([...imageUrls, ''])}
            className={btnGhostCls}
          >
            <Plus size={14} />
            Добавить ещё
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className={btnPrimaryCls}>
          {isEdit ? 'Сохранить' : 'Создать товар'}
          {isPending && <Loader2 size={14} className="animate-spin" />}

        </button>
      </div>
    </form>
  )
}
