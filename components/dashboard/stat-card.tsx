import { cn } from '@/lib/utils/format'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'red' | 'amber'
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500', icon: 'text-white' },
  emerald: { bg: 'bg-emerald-500', icon: 'text-white' },
  red: { bg: 'bg-red-500', icon: 'text-white' },
  amber: { bg: 'bg-amber-500', icon: 'text-white' },
}

export function StatCard({ label, value, icon: Icon, color = 'indigo' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', c.bg)}>
          <Icon size={18} className={c.icon} strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
