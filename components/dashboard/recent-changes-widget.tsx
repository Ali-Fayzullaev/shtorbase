import { type AuditLog } from '@/lib/types/database'
import { formatDateShort, formatPrice } from '@/lib/utils/format'
import { ArrowRight } from 'lucide-react'

interface RecentChangesWidgetProps {
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
}

export function RecentChangesWidget({ logs }: RecentChangesWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
      <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Последние изменения</h3>
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg px-2.5 py-2 -mx-1 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[12px] font-medium text-slate-600">{log.user?.full_name}</span>
              <span className="text-[11px] text-slate-400 tabular-nums">{formatDateShort(log.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-mono text-slate-400">{log.product?.sku}</span>
              <span className="text-slate-300">·</span>
              <span>{fieldNames[log.field_name] || log.field_name}</span>
              {log.old_value && (
                <>
                  <span className="text-red-400 line-through">
                    {log.field_name === 'price' ? `${formatPrice(Number(log.old_value))} ₸` : log.old_value}
                  </span>
                  <ArrowRight size={9} className="text-slate-300" />
                </>
              )}
              <span className="text-emerald-600 font-medium">
                {log.field_name === 'price' ? `${formatPrice(Number(log.new_value))} ₸` : log.new_value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
