'use client'

import { useActionState, useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Product, type Category, type Unit, type CustomField } from '@/lib/types/database'
import {
  createProductAction,
  updateProductAction,
  prepareVariantFields,
  createOneVariantAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon, Loader2, Upload, CheckCircle2, Circle, Package, ReceiptText, SlidersHorizontal, Images, Layers, X, PartyPopper } from 'lucide-react'

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
const labelCls = 'text-sm font-medium leading-none'
const selectCls =
  'flex h-9 w-full rounded-lg border border-input bg-background text-foreground px-2.5 py-1.5 text-sm shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
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
  variantOf?: { id: string; name: string; category_id: string; unit: string; variant_group_id: string | null }
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

export function ProductForm({ categories, units, customFields, product, initialCustomValues, variantOf }: ProductFormProps) {
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
  const [categoryId, setCategoryId] = useState(product?.category_id ?? variantOf?.category_id ?? '')
  const [unit, setUnit] = useState(product?.unit ?? variantOf?.unit ?? '')
  const variantGroupId = product?.variant_group_id ?? (variantOf ? (variantOf.variant_group_id ?? variantOf.id) : '')
  const [customValues, setCustomValues] = useState<Record<string, string>>(initialCustomValues ?? {})
  const [variantOptions, setVariantOptions] = useState<{ name: string; values: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const completion = [
    { label: 'Название', done: name.trim().length > 0 },
    { label: 'Категория', done: categoryId.length > 0 },
    { label: 'Единица', done: unit.length > 0 },
    { label: 'Цена', done: price.trim().length > 0 },
    { label: 'Остаток', done: stock.trim().length > 0 },
  ]
  const completedCount = completion.filter((item) => item.done).length

  // Поля без category_id — общие для всех товаров, остальные — только для своей категории
  const visibleCustomFields = customFields.filter((f) => !f.category_id || f.category_id === categoryId)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function addVariantOption() {
    setVariantOptions([...variantOptions, { name: '', values: '' }])
  }

  function updateVariantOption(index: number, field: 'name' | 'values', value: string) {
    setVariantOptions(variantOptions.map((o, i) => i === index ? { ...o, [field]: value } : o))
  }

  function removeVariantOption(index: number) {
    setVariantOptions(variantOptions.filter((_, i) => i !== index))
  }

  function toggleVariantValue(index: number, value: string) {
    setVariantOptions(variantOptions.map((o, i) => {
      if (i !== index) return o
      const current = o.values.split(',').map((v) => v.trim()).filter(Boolean)
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...o, values: next.join(', ') }
    }))
  }

  // Готовые select-поля этой категории (например «Цвет») — для них показываем галочки
  // вместо текста через запятую, чтобы не расходиться со значениями, уже заведёнными в настройках.
  const selectCustomFields = visibleCustomFields.filter((f) => f.field_type === 'select' && f.options && f.options.length > 0)

  const parsedVariantOptions = variantOptions
    .map((o) => ({ name: o.name.trim(), values: o.values.split(',').map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name.length > 0 && o.values.length > 0)
  const variantComboCount = parsedVariantOptions.reduce((acc, o) => acc * o.values.length, 1)
  const hasVariantOptions = parsedVariantOptions.length > 0

  const router = useRouter()
  const [batchPending, startBatchTransition] = useTransition()
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null)
  const [batchError, setBatchError] = useState('')

  function buildCombos(options: { name: string; values: string[] }[]): { name: string; value: string }[][] {
    let combos: { name: string; value: string }[][] = [[]]
    for (const opt of options) {
      const next: { name: string; value: string }[][] = []
      for (const combo of combos) {
        for (const value of opt.values) next.push([...combo, { name: opt.name, value }])
      }
      combos = next
    }
    return combos
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!hasVariantOptions) return // обычное создание/редактирование — нативный action делает всё сам

    e.preventDefault()
    setBatchError('')

    const tooShort = parsedVariantOptions.find((o) => o.name.length < 2)
    if (tooShort) {
      setBatchError(`Название параметра «${tooShort.name}» слишком короткое — минимум 2 символа`)
      return
    }

    const combos = buildCombos(parsedVariantOptions)
    if (combos.length > 60) {
      setBatchError(`Слишком много комбинаций (${combos.length}). Уменьшите количество значений или параметров.`)
      return
    }

    // При редактировании новые вариации присоединяются к группе текущего товара
    // (если у него ещё нет группы — она «самопривязывается» к его собственному id на сервере)
    const groupId = isEdit ? (product!.variant_group_id ?? product!.id) : crypto.randomUUID()
    const base = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      price: parseFloat(price) || 0,
      unit,
      stock: parseFloat(stock) || 0,
      vat_included: vatIncluded,
      note: note.trim() || null,
    }
    const extraCfValues = Object.entries(customValues)
      .filter(([, v]) => v.trim())
      .map(([field_id, value]) => ({ field_id, value }))

    setBatchProgress({ current: 0, total: combos.length, label: 'Готовим параметры…' })

    startBatchTransition(async () => {
      const prep = await prepareVariantFields(categoryId, parsedVariantOptions)
      if (prep.error || !prep.fieldIds) {
        setBatchError(prep.error ?? 'Не удалось подготовить параметры')
        setBatchProgress(null)
        return
      }

      for (let i = 0; i < combos.length; i++) {
        const combo = combos[i]
        const label = combo.map((c) => c.value).join(' / ')
        setBatchProgress({ current: i, total: combos.length, label: `${base.name} — ${label}` })

        const result = await createOneVariantAction({
          base,
          comboLabel: label,
          comboValues: combo.map((c) => ({ field_id: prep.fieldIds![c.name], value: c.value })),
          extraCfValues,
          groupId,
          variantIndex: i,
        })

        if (result.error) {
          setBatchError(`«${label}»: ${result.error} (создано ${i} из ${combos.length})`)
          setBatchProgress(null)
          return
        }
      }

      setBatchProgress({ current: combos.length, total: combos.length, label: '' })
      await new Promise((resolve) => setTimeout(resolve, 700))
      router.push('/catalog')
      router.refresh()
    })
  }

  return (
    <form action={formAction} onSubmit={handleFormSubmit} className="space-y-6">
      {product && <input type="hidden" name="product_id" value={product.id} />}
      <input type="hidden" name="vat_included" value={vatIncluded ? 'on' : ''} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="unit" value={unit} />
      <input type="hidden" name="variant_group_id" value={variantGroupId} />
      {/* Hidden custom field values — только поля, применимые к выбранной категории */}
      {visibleCustomFields.map((field) => (
        <input key={field.id} type="hidden" name={`cf_${field.id}`} value={customValues[field.id] ?? ''} />
      ))}

      {state?.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {variantOf && (
        <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 dark:border-indigo-500/20 dark:bg-indigo-500/10 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
          Вы создаёте вариацию товара «{variantOf.name}» — категория и единица измерения уже подставлены, измените только то, что отличается (цвет, размер и т.д.).
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
            <label htmlFor="sku" className={labelCls}>Артикул <span className="text-muted-foreground font-normal">(необязательно)</span></label>
            <input
              id="sku" name="sku" type="text"
              value={sku} onChange={(e) => setSku(e.target.value)}
              placeholder="Оставьте пустым — создадим сами"
              className={cn(inputCls, 'font-mono', state?.fieldErrors?.sku && errCls)}
            />
            <p className="text-[11px] text-muted-foreground">Нужен только для поиска/импорта. Не укажете — сгенерируем автоматически.</p>
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
              id="unit" name="unit" value={unit}
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

          {visibleCustomFields.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
              <span className={cn(labelCls, 'text-slate-600 dark:text-zinc-300')}>Дополнительные поля</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleCustomFields.map((field) => (
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

      {/* Вариации — создаём сразу несколько товаров по значениям (например, по цвету) */}
      {!variantOf && (
        <StepSection
          step="4"
          title="Вариации"
          description={
            isEdit
              ? 'Добавьте ещё вариации к этому товару — укажите параметр и значения через запятую. Мы создадим отдельную карточку на каждое значение (текущий товар останется как есть — поля формы выше используются только как шаблон для новых карточек).'
              : 'Если товар бывает в разных цветах/размерах — укажите параметр и значения через запятую. Мы создадим отдельную карточку на каждое значение, с общими остальными полями.'
          }
          icon={Layers}
        >
          <div className="space-y-3">
            {selectCustomFields.length > 0 && (
              <datalist id="variant-field-names">
                {selectCustomFields.map((f) => <option key={f.id} value={f.name} />)}
              </datalist>
            )}

            {variantOptions.map((opt, i) => {
              const matchedField = selectCustomFields.find(
                (f) => f.name.trim().toLowerCase() === opt.name.trim().toLowerCase()
              )
              const selectedValues = opt.values.split(',').map((v) => v.trim()).filter(Boolean)

              return (
                <div key={i} className={cn('space-y-2 rounded-lg', matchedField && 'border border-border/60 p-3')}>
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      list="variant-field-names"
                      value={opt.name}
                      onChange={(e) => updateVariantOption(i, 'name', e.target.value)}
                      placeholder="Параметр: Цвет"
                      className={cn(inputCls, 'sm:w-40')}
                    />
                    {!matchedField && (
                      <input
                        type="text"
                        value={opt.values}
                        onChange={(e) => updateVariantOption(i, 'values', e.target.value)}
                        placeholder="Значения: Красный, Синий, Зелёный"
                        className={cn(inputCls, 'flex-1')}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeVariantOption(i)}
                      className="mt-1.5 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {matchedField && (
                    <div className="flex flex-wrap gap-1.5">
                      {matchedField.options!.map((option) => {
                        const checked = selectedValues.includes(option)
                        return (
                          <label
                            key={option}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors select-none',
                              checked
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300'
                                : 'border-border/60 bg-background/60 text-muted-foreground hover:border-border'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleVariantValue(i, option)}
                              className="sr-only"
                            />
                            {checked ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                            {option}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <button type="button" onClick={addVariantOption} className={cn(btnOutlineCls, 'h-8 gap-1.5 px-3 text-xs')}>
              <Plus size={13} />
              Добавить параметр
            </button>

            {selectCustomFields.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Совет: назовите параметр так же, как готовое поле категории (например, «{selectCustomFields[0].name}») — появятся галочки с готовыми значениями вместо ручного ввода.
              </p>
            )}

            {hasVariantOptions && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20 px-3 py-2 text-[13px] text-indigo-700 dark:text-indigo-300">
                Будет создано отдельных карточек: <strong>{variantComboCount}</strong> — по одной на каждую комбинацию значений. Артикул, цену и остаток можно будет скорректировать у каждой отдельно.
              </div>
            )}
          </div>
        </StepSection>
      )}

      {/* Images (only for creation) */}
      {!isEdit && (
        <StepSection
          step="5"
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
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-4">
        {(isPending || batchPending) && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-border/60">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-indeterminate" />
          </div>
        )}
        {batchError && (
          <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {batchError}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-relaxed text-muted-foreground">
            {hasVariantOptions
              ? `Будет создано ${variantComboCount} новых карточек — процесс покажет каждую по очереди.`
              : isEdit
                ? 'После сохранения карточка сразу обновится в каталоге.'
                : 'После создания товар появится в каталоге и будет доступен в заказах.'}
          </div>
          <div className="flex items-center gap-3 pt-2 sm:pt-0">
            <button type="submit" disabled={isPending || batchPending} className={btnPrimaryCls}>
              {(isPending || batchPending) && <Loader2 size={14} className="animate-spin" />}
              {hasVariantOptions ? `Создать ${variantComboCount} карточек` : isEdit ? 'Сохранить' : 'Создать товар'}
            </button>
          </div>
        </div>
      </div>

      {/* Прогресс создания вариаций */}
      {(batchPending || batchProgress) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-scale-in">
            {batchProgress && batchProgress.current >= batchProgress.total && !batchError ? (
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                  <PartyPopper size={22} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Готово! Создано карточек: {batchProgress.total}</h3>
                <p className="text-xs text-muted-foreground">Переходим в каталог…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Создаём вариации товара</h3>
                    <p className="text-xs text-muted-foreground truncate">{batchProgress?.label || 'Готовим параметры…'}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Прогресс</span>
                    <span className="tabular-nums">{batchProgress?.current ?? 0}/{batchProgress?.total ?? variantComboCount}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(100, Math.round(((batchProgress?.current ?? 0) / (batchProgress?.total || variantComboCount || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
