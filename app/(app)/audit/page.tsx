import { Header } from '@/components/layout/header'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditPagination } from '@/components/audit/audit-pagination'
import { getAuditLogs } from '@/lib/actions/products'
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

interface AuditPageProps {
  searchParams: Promise<{
    field?: string
    action?: string
    page?: string
  }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams

  const { logs, total, page, totalPages } = await getAuditLogs({
    field: params.field,
    action: params.action,
    page: params.page ? parseInt(params.page) : 1,
  })

  return (
    <>
      <Header title="Логи изменений" description={`${total} записей`} />

      <div className="p-5 space-y-4">
        <AuditFilters currentField={params.field} currentAction={params.action} />

        <div className="overflow-x-auto rounded-xl glass-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Кто</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Товар</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Поле</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Было</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">→</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Стало</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    Нет записей
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-[13px] tabular-nums text-slate-400 whitespace-nowrap">
                    {formatDateShort(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-700 whitespace-nowrap">
                    {log.user?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-slate-400">{log.product?.sku}</span>
                    <span className="text-[13px] text-slate-700 ml-2">{log.product?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {fieldNames[log.field_name] || log.field_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-red-500 line-through">
                    {formatValue(log.field_name, log.old_value)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ArrowRight size={14} className="text-slate-300 mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-emerald-600">
                    {formatValue(log.field_name, log.new_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <AuditPagination currentPage={page} totalPages={totalPages} />
        )}
      </div>
    </>
  )
}
