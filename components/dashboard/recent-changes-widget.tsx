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
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">📝 Последние изменения</h3>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl p-2.5 -mx-2 hover:bg-background transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{log.user?.full_name}</span>
              <span className="text-xs text-muted tabular-nums">{formatDateShort(log.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-mono">{log.product?.sku}</span>
              <span>·</span>
              <span>{fieldNames[log.field_name] || log.field_name}</span>
              {log.old_value && (
                <>
                  <span className="text-red-400 line-through">
                    {log.field_name === 'price' ? `${formatPrice(Number(log.old_value))} ₸` : log.old_value}
                  </span>
                  <ArrowRight size={10} />
                </>
              )}
              <span className="text-success font-medium">
                {log.field_name === 'price' ? `${formatPrice(Number(log.new_value))} ₸` : log.new_value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
