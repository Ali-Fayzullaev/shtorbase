import { cn } from '@/lib/utils/format'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  trend?: string
}

export function StatCard({ label, value, icon: Icon, color = 'text-primary', trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted">{trend}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-background', color)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
