'use client'

import { useEffect } from 'react'
import type { Order } from '@/lib/types/database'
import { formatPrice } from '@/lib/utils/format'

interface Props {
  order: Order
  statusLabel: string
}

export function PrintOrderView({ order, statusLabel }: Props) {
  useEffect(() => {
    window.print()
  }, [])

  return (
    <div className="max-w-[800px] mx-auto p-8 text-sm text-black bg-white print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ШторБаза</h1>
          <p className="text-xs text-gray-500 mt-1">Внутренний документ</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">Заказ #{order.order_number}</p>
          <p className="text-xs text-gray-500 mt-1">
            от {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[13px]">
        <div>
          <span className="text-gray-500">Статус:</span>{' '}
          <span className="font-medium">{statusLabel}</span>
        </div>
        <div>
          <span className="text-gray-500">Телефон:</span>{' '}
          <span className="font-medium">{order.phone || '—'}</span>
        </div>
        {order.client && (
          <div>
            <span className="text-gray-500">Клиент:</span>{' '}
            <span className="font-medium">{order.client.name}</span>
          </div>
        )}
        {order.assigned_user && (
          <div>
            <span className="text-gray-500">Исполнитель:</span>{' '}
            <span className="font-medium">{order.assigned_user.full_name}</span>
          </div>
        )}
        {order.deadline && (
          <div>
            <span className="text-gray-500">Дедлайн:</span>{' '}
            <span className="font-medium">
              {new Date(order.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}
        {order.note && (
          <div className="col-span-2">
            <span className="text-gray-500">Примечание:</span>{' '}
            <span>{order.note}</span>
          </div>
        )}
      </div>

      {/* Items table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 pr-2 font-semibold">№</th>
            <th className="text-left py-2 pr-2 font-semibold">Артикул</th>
            <th className="text-left py-2 pr-2 font-semibold">Наименование</th>
            <th className="text-right py-2 pr-2 font-semibold">Кол-во</th>
            <th className="text-right py-2 pr-2 font-semibold">Цена</th>
            <th className="text-right py-2 font-semibold">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-2 pr-2">{idx + 1}</td>
              <td className="py-2 pr-2 font-mono text-xs">{item.product?.sku ?? '—'}</td>
              <td className="py-2 pr-2">{item.product?.name ?? 'Товар удалён'}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{formatPrice(item.unit_price)} ₸</td>
              <td className="py-2 text-right tabular-nums font-medium">{formatPrice(item.total_price)} ₸</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan={5} className="py-3 text-right font-bold">Итого:</td>
            <td className="py-3 text-right font-bold tabular-nums text-base">{formatPrice(order.total_amount)} ₸</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
        <div>
          <div className="border-b border-black mb-1 h-8" />
          <p className="text-xs text-gray-500">Подпись ответственного</p>
        </div>
        <div>
          <div className="border-b border-black mb-1 h-8" />
          <p className="text-xs text-gray-500">Подпись клиента</p>
        </div>
      </div>

      {/* Print controls (hidden on print) */}
      <div className="mt-8 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Печать
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Назад
        </button>
      </div>
    </div>
  )
}
