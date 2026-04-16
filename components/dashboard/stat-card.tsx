import { cn } from '@/lib/utils/format'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'red' | 'amber'
  subtitle?: string
}

const colorMap = {
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/20',
    valueTint: 'text-zinc-900',
    bar: 'from-indigo-500/20 to-transparent',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    valueTint: 'text-zinc-900',
    bar: 'from-emerald-500/20 to-transparent',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    shadow: 'shadow-red-500/20',
    valueTint: 'text-zinc-900',
    bar: 'from-red-500/20 to-transparent',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
    valueTint: 'text-zinc-900',
    bar: 'from-amber-500/20 to-transparent',
  },
}

export function StatCard({ label, value, icon: Icon, color = 'indigo', subtitle }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/60 p-4 transition-all duration-300 hover:shadow-md hover:shadow-zinc-200/50 hover:border-zinc-200">
      {/* Subtle gradient accent bar at top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', c.bar)} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-zinc-500">{label}</p>
          <p className={cn('text-2xl font-bold tabular-nums tracking-tight', c.valueTint)}>{value}</p>
          {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110', c.iconBg, c.shadow)}>
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
