import { type Debtor } from '@/lib/actions/reports'
import { formatPrice } from '@/lib/utils/format'
import { Users, Phone, MessageCircle } from 'lucide-react'

interface DebtorsTableProps {
  debtors: Debtor[]
}

function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

export function DebtorsTable({ debtors }: DebtorsTableProps) {
  return (
    <div className="rounded-2xl glass-card overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Users size={16} className="text-red-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Должники</h3>
        <span className="text-xs text-zinc-400">({debtors.length})</span>
      </div>

      {debtors.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-500">Долгов нет</p>
          <p className="text-xs text-zinc-400 mt-1">Все заказы оплачены полностью</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
          {debtors.map((d, i) => (
            <div key={d.clientId ?? `${d.clientName}-${i}`} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{d.clientName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {d.phone && (
                    <>
                      <a href={`tel:${d.phone}`} className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700">
                        <Phone size={10} /> {d.phone}
                      </a>
                      <a
                        href={whatsappLink(d.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700"
                      >
                        <MessageCircle size={10} /> WA
                      </a>
                    </>
                  )}
                  <span className="text-[11px] text-zinc-400">
                    {d.orderCount} {d.orderCount === 1 ? 'заказ' : 'заказа'}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                {formatPrice(d.debt)} ₸
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
