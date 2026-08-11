import { Suspense } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { RevenueChart } from '@/components/reports/revenue-chart'
import { DebtorsTable } from '@/components/reports/debtors-table'
import { getRevenueReport, getDiscountsReport, getDebtSummary, type ReportPeriod } from '@/lib/actions/reports'
import { requireProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { cn, formatPrice } from '@/lib/utils/format'
import { Wallet, Percent, AlertCircle } from 'lucide-react'

interface ReportsPageProps {
  searchParams: Promise<{ period?: string }>
}

const periodLabels: Record<ReportPeriod, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
}

function isValidPeriod(v: string | undefined): v is ReportPeriod {
  return v === 'today' || v === 'week' || v === 'month'
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')

  const { period: periodParam } = await searchParams
  const period: ReportPeriod = isValidPeriod(periodParam) ? periodParam : 'week'

  return (
    <>
      <Header title="Отчёты" description="Выручка, скидки и долги клиентов" />

      <div className="p-4 sm:p-6 space-y-5 page-enter">
        {/* Period switch */}
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
          {(Object.keys(periodLabels) as ReportPeriod[]).map((p) => (
            <Link
              key={p}
              href={`/reports?period=${p}`}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all',
                p === period
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {periodLabels[p]}
            </Link>
          ))}
        </div>

        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection period={period} />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartAndDebtSection period={period} />
        </Suspense>
      </div>
    </>
  )
}

async function KpiSection({ period }: { period: ReportPeriod }) {
  const [revenue, discounts, debt] = await Promise.all([
    getRevenueReport(period),
    getDiscountsReport(period),
    getDebtSummary(),
  ])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-500/20">
            <Wallet size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Выручка</p>
            <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 truncate">{formatPrice(revenue.total)} ₸</p>
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-sm shadow-red-500/20">
            <AlertCircle size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Долг клиентов</p>
            <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 truncate">{formatPrice(debt.totalDebt)} ₸</p>
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-2xl glass-card p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/30 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/20">
            <Percent size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Скидки за период</p>
            <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 truncate">{formatPrice(discounts.total)} ₸</p>
          </div>
        </div>
      </div>
    </div>
  )
}

async function ChartAndDebtSection({ period }: { period: ReportPeriod }) {
  const [revenue, debt] = await Promise.all([
    getRevenueReport(period),
    getDebtSummary(),
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3">
        <RevenueChart data={revenue.daily} total={revenue.total} paymentCount={revenue.paymentCount} />
      </div>
      <div className="lg:col-span-2">
        <DebtorsTable debtors={debt.debtors} />
      </div>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 h-72 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      <div className="lg:col-span-2 h-72 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
    </div>
  )
}
