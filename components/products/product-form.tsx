'use client'

import { useActionState, useState, useRef } from 'react'
import { type Product, type Category, type Unit, type CustomField } from '@/lib/types/database'
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon, Loader2, Upload, CheckCircle2, Circle, Package, ReceiptText, SlidersHorizontal, Images } from 'lucide-react'

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

function StepSection({
  step,
  title,
  description,
  icon: Icon,
  children,
}: {
  step: string
  title: string
  description: string
  icon: typeof Package
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3 border-b border-border/60 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Шаг {step}</div>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
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

  const completion = [
    { label: 'Артикул', done: sku.trim().length > 0 },
    { label: 'Название', done: name.trim().length > 0 },
    { label: 'Категория', done: categoryId.length > 0 },
    { label: 'Единица', done: unit.length > 0 },
    { label: 'Цена', done: price.trim().length > 0 },
    { label: 'Остаток', done: stock.trim().length > 0 },
  ]
  const completedCount = completion.filter((item) => item.done).length

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-zinc-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Сценарий заполнения</div>
            <h3 className="mt-1 text-sm font-semibold text-foreground">
              {isEdit ? 'Обновите данные товара и сохраните изменения' : 'Сначала заполните ядро карточки, затем добавьте детали и изображения'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Обязательные поля сведены в первые два шага. Дополнительные параметры и фото можно добавить после основного описания.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200/80 bg-white/80 px-4 py-3 text-center dark:border-indigo-500/20 dark:bg-zinc-950/60">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Готовность</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{completedCount}/{completion.length}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {completion.map((item) => (
            <div
              key={item.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                item.done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-zinc-200 bg-white text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400'
              )}
            >
              {item.done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <StepSection
        step="1"
        title="Идентификация товара"
        description="Опишите товар так, чтобы его можно было быстро найти в каталоге и отличить от соседних позиций."
        icon={Package}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="sku" className={labelCls}>Артикул</label>
            <input
              id="sku" name="sku" type="text"
              value={sku} onChange={(e) => setSku(e.target.value)}
              placeholder="SH-0001"
              className={cn(inputCls, 'font-mono', state?.fieldErrors?.sku && errCls)}
            />
            <p className="text-[11px] text-muted-foreground">Короткий уникальный код для поиска и импорта.</p>
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
            <p className="text-[11px] text-muted-foreground">Лучше писать материал, коллекцию и ключевое отличие прямо в названии.</p>
            {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </StepSection>

      <StepSection
        step="2"
        title="Цена и остатки"
        description="Задайте коммерческие данные, которые влияют на корзину, печать заказа и экспорт."
        icon={ReceiptText}
      >
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
            <label className="flex min-h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 cursor-pointer">
              <input
                type="checkbox" checked={vatIncluded}
                onChange={(e) => setVatIncluded(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary accent-primary"
              />
              <span className="text-sm text-foreground">Цена включает НДС</span>
            </label>
          </div>
        </div>
      </StepSection>

      <StepSection
        step="3"
        title="Описание и свойства"
        description="Добавьте информацию для сотрудников и параметры, которые помогут в продаже и поиске."
        icon={SlidersHorizontal}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className={labelCls}>Описание</label>
            <textarea
              id="description" name="description" rows={3}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара..."
              className={cn(inputCls, 'min-h-20 resize-none py-2')}
            />
          </div>

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

          {customFields.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
              <span className={cn(labelCls, 'text-slate-600 dark:text-zinc-300')}>Дополнительные поля</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
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
        </div>
      </StepSection>

      {/* Images (only for creation) */}
      {!isEdit && (
        <StepSection
          step="4"
          title="Изображения"
          description="Фотографии можно загрузить с устройства или указать ссылками. Это улучшит карточку в каталоге и корзине."
          icon={Images}
        >
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
              className={cn(btnOutlineCls, 'min-h-28 px-3 gap-1.5 w-full justify-center border-dashed border-2 flex-col text-center')}
            >
              <Upload size={14} />
              <span className="font-medium">Загрузить с устройства</span>
              <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP или GIF. Можно выбрать несколько файлов.</span>
            </button>
            {imageFiles.length > 0 && (
              <ul className="space-y-1">
                {imageFiles.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 text-xs">
                    <ImageIcon size={12} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                    <span className="flex-1 truncate text-slate-600 dark:text-zinc-300">{file.name}</span>
                    <span className="text-slate-400 dark:text-zinc-500 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 dark:text-zinc-500 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* URL inputs */}
          <p className="text-xs text-slate-400 dark:text-zinc-500">Или добавьте по ссылке:</p>
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
        </StepSection>
      )}

      {/* Submit */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-relaxed text-muted-foreground">
          {isEdit ? 'После сохранения карточка сразу обновится в каталоге.' : 'После создания товар появится в каталоге и будет доступен в заказах.'}
        </div>
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
        <button type="submit" disabled={isPending} className={btnPrimaryCls}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Сохранить' : 'Создать товар'}
        </button>
        </div>
      </div>
    </form>
  )
}
