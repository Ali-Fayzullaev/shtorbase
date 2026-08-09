import { type PaymentStatus } from '@/lib/types/database'
import { cn } from '@/lib/utils/format'

const config: Record<PaymentStatus, { label: string; cls: string }> = {
  unpaid: { label: 'Не оплачено', cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-500/20' },
  partial: { label: 'Частично', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/20' },
  paid: { label: 'Оплачено', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20' },
}

interface PaymentBadgeProps {
  status: PaymentStatus
  paidAmount: number
  totalAmount: number
  className?: string
}

export function PaymentBadge({ status, paidAmount, totalAmount, className }: PaymentBadgeProps) {
  const cfg = config[status] ?? config.unpaid
  const percent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', cfg.cls, className)}>
      {cfg.label}
      {status === 'partial' && ` ${percent}%`}
    </span>
  )
}
