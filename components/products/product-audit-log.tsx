import { type AuditLog } from '@/lib/types/database'
import { formatDate, formatPrice, cn } from '@/lib/utils/format'
import { ArrowRight } from 'lucide-react'

interface ProductAuditLogProps {
  logs: AuditLog[]
}

const fieldNames: Record<string, string> = {
  price: 'Цена',
  stock: 'Остаток',
  note: 'Заметка',
  status: 'Статус',
  name: 'Название',
  description: 'Описание',
  product: 'Товар',
  vat_included: 'НДС',
}

function formatValue(field: string, value: string | null) {
  if (!value) return '—'
  if (field === 'price') return `${formatPrice(Number(value))} ₸`
  if (field === 'vat_included') return value === 'true' ? 'Да' : 'Нет'
  if (field === 'status') {
    const labels: Record<string, string> = { active: 'Активен', hidden: 'Скрыт', discontinued: 'Снят' }
    return labels[value] ?? value
  }
  return value
}

export function ProductAuditLog({ logs }: ProductAuditLogProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-[13px] font-semibold text-slate-700">История изменений</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="px-4 py-2.5 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-slate-600">{log.user?.full_name}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 tabular-nums">{formatDate(log.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-0.5">
                <span className="font-medium">{fieldNames[log.field_name] ?? log.field_name}</span>
                {log.old_value && (
                  <>
                    <span className="text-red-400 line-through">{formatValue(log.field_name, log.old_value)}</span>
                    <ArrowRight size={10} className="text-slate-300" />
                  </>
                )}
                <span className="text-emerald-600 font-medium">{formatValue(log.field_name, log.new_value)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
