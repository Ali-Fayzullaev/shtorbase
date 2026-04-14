'use client'

import { useActionState } from 'react'
import { type Product, type Category } from '@/lib/types/database'
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from '@/lib/actions/product-mutations'
import { cn } from '@/lib/utils/format'

interface ProductFormProps {
  categories: Category[]
  product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const isEdit = !!product
  const action = isEdit ? updateProductAction : createProductAction
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {product && <input type="hidden" name="product_id" value={product.id} />}

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {state.error}
        </div>
      )}

      {/* SKU + Name */}
      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Артикул"
          name="sku"
          defaultValue={product?.sku}
          error={state?.fieldErrors?.sku}
          placeholder="SH-0001"
          className="font-mono"
        />
        <div className="col-span-2">
          <Field
            label="Название"
            name="name"
            defaultValue={product?.name}
            error={state?.fieldErrors?.name}
            placeholder="Штора «Венеция» бархат"
          />
        </div>
      </div>

      {/* Category + Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-1">Категория</label>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ''}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all',
              state?.fieldErrors?.category_id ? 'border-red-300' : 'border-slate-200'
            )}
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {state?.fieldErrors?.category_id && (
            <p className="mt-1 text-[11px] text-red-500">{state.fieldErrors.category_id}</p>
          )}
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-1">Единица измерения</label>
          <select
            name="unit"
            defaultValue={product?.unit ?? ''}
            disabled={isEdit}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all',
              state?.fieldErrors?.unit ? 'border-red-300' : 'border-slate-200',
              isEdit && 'opacity-60 cursor-not-allowed'
            )}
          >
            <option value="">Выберите</option>
            <option value="meter">Метр</option>
            <option value="piece">Штука</option>
          </select>
          {isEdit && (
            <p className="mt-1 text-[11px] text-slate-400">Нельзя изменить после создания</p>
          )}
          {state?.fieldErrors?.unit && (
            <p className="mt-1 text-[11px] text-red-500">{state.fieldErrors.unit}</p>
          )}
        </div>
      </div>

      {/* Price + Stock + VAT */}
      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Цена, ₸"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.price?.toString()}
          error={state?.fieldErrors?.price}
          placeholder="4500"
        />
        <Field
          label="Остаток"
          name="stock"
          type="number"
          step="0.1"
          min="0"
          defaultValue={product?.stock?.toString()}
          error={state?.fieldErrors?.stock}
          placeholder="100"
        />
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-1">НДС</label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              name="vat_included"
              defaultChecked={product?.vat_included ?? true}
              className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500/20"
            />
            <span className="text-[13px] text-slate-600">Цена включает НДС</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[12px] font-medium text-slate-500 mb-1">Описание</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ''}
          placeholder="Краткое описание товара..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all resize-none"
        />
      </div>

      {/* Note */}
      <Field
        label="Заметка для сотрудников"
        name="note"
        defaultValue={product?.note ?? ''}
        error={state?.fieldErrors?.note}
        placeholder="Например: «Режется от 1 м, шаг 0.5 м»"
      />

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2 text-[13px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {isEdit ? 'Сохранить' : 'Создать товар'}
        </button>
      </div>
    </form>
  )
}

// Reusable field component
function Field({
  label,
  name,
  error,
  className,
  ...props
}: {
  label: string
  name: string
  error?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-500 mb-1">{label}</label>
      <input
        name={name}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all',
          error ? 'border-red-300' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
