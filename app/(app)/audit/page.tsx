import { Header } from '@/components/layout/header'
import { demoAuditLogs } from '@/lib/demo-data'
import { formatDateShort, formatPrice } from '@/lib/utils/format'
import { ArrowRight } from 'lucide-react'

const fieldNames: Record<string, string> = {
  price: 'Цена',
  stock: 'Остаток',
  note: 'Заметка',
  status: 'Статус',
  name: 'Название',
  description: 'Описание',
  product: 'Товар создан',
}

function formatValue(field: string, value: string | null) {
  if (!value) return '—'
  if (field === 'price') return `${formatPrice(Number(value))} ₸`
  if (field === 'stock') return value
  return value
}

export default function AuditPage() {
  const logs = demoAuditLogs

  return (
    <>
      <Header title="Логи изменений" description="История всех изменений товаров" />

      <div className="p-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Кто</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Товар</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Поле</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Было</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-center">→</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Стало</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Комментарий</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm tabular-nums text-muted whitespace-nowrap">
                    {formatDateShort(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                    {log.user?.full_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-muted">{log.product?.sku}</span>
                    <span className="text-sm text-foreground ml-2">{log.product?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted">
                      {fieldNames[log.field_name] || log.field_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-red-500 line-through">
                    {formatValue(log.field_name, log.old_value)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ArrowRight size={14} className="text-muted mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-success">
                    {formatValue(log.field_name, log.new_value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {log.comment || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
