import { type AuditLog } from '@/lib/types/database'
import { formatDateShort, formatPrice } from '@/lib/utils/format'
import { ArrowRight, History } from 'lucide-react'

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
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <History size={15} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-900">Последние изменения</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {logs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-400">Нет изменений</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-5 py-2.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-slate-700">{log.user?.full_name}</span>
                <span className="text-[11px] text-slate-400 tabular-nums">{formatDateShort(log.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
          ))
        )}
      </div>
    </div>
  )
}
