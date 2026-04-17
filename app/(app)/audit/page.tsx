import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditPagination } from '@/components/audit/audit-pagination'
import { getAuditLogs } from '@/lib/actions/products'
import { formatPrice } from '@/lib/utils/format'
import {
  ArrowRight,
  User,
  Plus,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  Boxes,
  FileText,
  Tag,
  Activity,
  Clock,
  Inbox,
} from 'lucide-react'

const fieldConfig: Record<string, { label: string; icon: typeof Pencil; tint: string }> = {
  price: { label: 'Цена', icon: DollarSign, tint: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
  stock: { label: 'Остаток', icon: Boxes, tint: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  note: { label: 'Заметка', icon: FileText, tint: 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300' },
  status: { label: 'Статус', icon: Tag, tint: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
  name: { label: 'Название', icon: Pencil, tint: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400' },
  description: { label: 'Описание', icon: FileText, tint: 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300' },
  product: { label: 'Создание', icon: Package, tint: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
}

const actionConfig: Record<string, { label: string; icon: typeof Plus; tint: string }> = {
  create: { label: 'создал', icon: Plus, tint: 'text-emerald-600 dark:text-emerald-400' },
  update: { label: 'изменил', icon: Pencil, tint: 'text-sky-600 dark:text-sky-400' },
  delete: { label: 'удалил', icon: Trash2, tint: 'text-red-600 dark:text-red-400' },
}

function formatValue(field: string, value: string | null) {
  if (!value) return '—'
  if (field === 'price') return `${formatPrice(Number(value))} ₸`
  return value
}

function formatRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} дн назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatExact(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupByDay<T extends { created_at: string }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let currentKey = ''
  for (const item of items) {
    const d = new Date(item.created_at)
    d.setHours(0, 0, 0, 0)
    let label: string
    if (d.getTime() === today.getTime()) label = 'Сегодня'
    else if (d.getTime() === yesterday.getTime()) label = 'Вчера'
    else label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

    if (label !== currentKey) {
      groups.push({ label, items: [] })
      currentKey = label
    }
    groups[groups.length - 1].items.push(item)
  }
  return groups
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

  const createCount = logs.filter((l) => l.action === 'create').length
  const updateCount = logs.filter((l) => l.action === 'update').length
  const deleteCount = logs.filter((l) => l.action === 'delete').length

  const groups = groupByDay(logs)
  const hasFilters = !!(params.field || params.action)

  return (
    <>
      <Header title="Журнал изменений" description={`Всего записей: ${total.toLocaleString('ru-RU')}`} />

      <div className="p-5 space-y-5">
        {/* Summary pills */}
        {logs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full glass-card px-3.5 py-1.5">
              <Activity size={13} className="text-indigo-500" />
              <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">На странице: {logs.length}</span>
            </div>
            {createCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 ring-1 ring-emerald-200/60 dark:ring-emerald-900/60">
                <Plus size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">{createCount}</span>
              </div>
            )}
            {updateCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 ring-1 ring-sky-200/60 dark:ring-sky-900/60">
                <Pencil size={12} className="text-sky-600 dark:text-sky-400" />
                <span className="text-[12px] font-semibold text-sky-700 dark:text-sky-300">{updateCount}</span>
              </div>
            )}
            {deleteCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1.5 ring-1 ring-red-200/60 dark:ring-red-900/60">
                <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                <span className="text-[12px] font-semibold text-red-700 dark:text-red-300">{deleteCount}</span>
              </div>
            )}
          </div>
        )}

        <AuditFilters currentField={params.field} currentAction={params.action} />

        {/* Empty state */}
        {logs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Inbox size={26} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
              {hasFilters ? 'Ничего не найдено' : 'Пока нет записей'}
            </h3>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {hasFilters
                ? 'Попробуйте изменить фильтры — возможно, по текущим условиям записей ещё не было.'
                : 'Любые изменения товаров будут автоматически появляться здесь.'}
            </p>
          </div>
        ) : (
          /* Timeline by day */
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full glass-card px-3 py-1">
                    <Clock size={11} className="text-zinc-400 dark:text-zinc-500" />
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      {group.label}
                    </h2>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 dark:from-zinc-700 to-transparent" />
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{group.items.length}</span>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden">
                  <ul className="divide-y divide-zinc-100/80 dark:divide-zinc-800/80">
                    {group.items.map((log) => {
                      const field = fieldConfig[log.field_name] ?? {
                        label: log.field_name,
                        icon: Pencil,
                        tint: 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300',
                      }
                      const actionCfg = actionConfig[log.action] ?? {
                        label: log.action,
                        icon: Pencil,
                        tint: 'text-zinc-500',
                      }
                      const FieldIcon = field.icon
                      const ActionIcon = actionCfg.icon

                      return (
                        <li key={log.id} className="group px-4 py-3.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Action indicator */}
                            <div className="relative mt-0.5 shrink-0">
                              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${field.tint}`}>
                                <FieldIcon size={14} strokeWidth={2.2} />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-900 ring-2 ring-white dark:ring-zinc-900">
                                <ActionIcon size={9} strokeWidth={2.8} className={actionCfg.tint} />
                              </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                                  <User size={11} className="text-zinc-400 dark:text-zinc-500" />
                                  {log.user?.full_name ?? 'Система'}
                                </span>
                                <span className={`text-[12px] font-medium ${actionCfg.tint}`}>{actionCfg.label}</span>
                                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">«{field.label.toLowerCase()}»</span>
                                {log.product && (
                                  <>
                                    <span className="text-[12px] text-zinc-400 dark:text-zinc-500">у товара</span>
                                    <Link
                                      href={`/catalog/${log.product.id}`}
                                      className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2"
                                    >
                                      {log.product.name}
                                    </Link>
                                    {log.product.sku && (
                                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                        {log.product.sku}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Diff */}
                              {log.action === 'update' && (
                                <div className="mt-2 flex items-center flex-wrap gap-2 text-[12.5px] tabular-nums">
                                  <span className="inline-flex items-center max-w-[200px] truncate rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-red-700 dark:text-red-300 line-through decoration-red-300/70 dark:decoration-red-600/70">
                                    {formatValue(log.field_name, log.old_value)}
                                  </span>
                                  <ArrowRight size={12} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                                  <span className="inline-flex items-center max-w-[200px] truncate rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                                    {formatValue(log.field_name, log.new_value)}
                                  </span>
                                </div>
                              )}
                              {log.action === 'create' && log.new_value && (
                                <div className="mt-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-400">
                                  <span className="inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                                    {formatValue(log.field_name, log.new_value)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Time */}
                            <time
                              dateTime={log.created_at}
                              title={formatExact(log.created_at)}
                              className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500 whitespace-nowrap pt-1"
                            >
                              {formatRelative(log.created_at)}
                            </time>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        )}

        {totalPages > 1 && <AuditPagination currentPage={page} totalPages={totalPages} />}
      </div>
    </>
  )
}
