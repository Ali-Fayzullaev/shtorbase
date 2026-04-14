import { cn } from '@/lib/utils/format'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'red' | 'amber'
}

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', ring: 'ring-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-500', ring: 'ring-red-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', ring: 'ring-amber-100' },
}

export function StatCard({ label, value, icon: Icon, color = 'indigo' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', c.bg, c.text, c.ring)}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
          <p className="text-xl font-bold text-slate-800 tabular-nums leading-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  )
}
