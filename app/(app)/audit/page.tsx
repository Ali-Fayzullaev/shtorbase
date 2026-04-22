import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditPagination } from '@/components/audit/audit-pagination'
import { getAuditLogs } from '@/lib/actions/products'
import { formatPrice, cn } from '@/lib/utils/format'
import {
  ArrowRight,
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
  ShieldCheck,
  Filter,
  Eye,
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

function getInitials(name: string): string {
  const clean = name.includes('@') ? name.split('@')[0] : name
  const parts = clean.split(/[\s._-]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
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
        <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-white/[0.06] dark:from-zinc-950 dark:to-zinc-900">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Понятный аудит</div>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Кто и что изменил в каталоге</h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Здесь фиксируются создания, изменения и удаления. Экран нужен не только для контроля, но и для ответа на обычные вопросы: кто поменял цену, когда закончился остаток и почему карточка товара выглядит иначе.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">
                  <ShieldCheck size={13} className="text-indigo-500" />
                  История хранится автоматически
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">
                  <Filter size={13} className="text-amber-500" />
                  Можно сузить по действию и полю
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">
                  <Eye size={13} className="text-emerald-500" />
                  Открывайте товар прямо из записи
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">Что видно на странице</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{logs.length}</div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400">записей в текущей выборке</div>
              </div>
              <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-2.5 dark:border-white/[0.06] dark:bg-zinc-900/50">
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500">Фильтры</div>
                <div className="mt-1 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                  {hasFilters ? 'Показана суженная выборка' : 'Показаны все последние изменения'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-4 shadow-sm dark:border-white/[0.06] dark:bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">На странице</div>
                  <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{logs.length}</div>
                </div>
              </div>
            </div>
            {createCount > 0 && (
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Plus size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600/70 dark:text-emerald-300/70">Создания</div>
                    <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{createCount}</div>
                  </div>
                </div>
              </div>
            )}
            {updateCount > 0 && (
              <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-4 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                    <Pencil size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600/70 dark:text-sky-300/70">Изменения</div>
                    <div className="text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-300">{updateCount}</div>
                  </div>
                </div>
              </div>
            )}
            {deleteCount > 0 && (
              <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-4 shadow-sm dark:border-red-500/20 dark:bg-red-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600/70 dark:text-red-300/70">Удаления</div>
                    <div className="text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">{deleteCount}</div>
                  </div>
                </div>
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
                      const userName = log.user?.full_name ?? 'Система'
                      const initials = getInitials(userName)

                      return (
                        <li
                          key={log.id}
                          className={cn(
                            'group border-l-[3px] px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors',
                            log.action === 'create' && 'border-l-emerald-400 dark:border-l-emerald-500',
                            log.action === 'update' && 'border-l-sky-400 dark:border-l-sky-500',
                            log.action === 'delete' && 'border-l-red-400 dark:border-l-red-500',
                            !['create','update','delete'].includes(log.action) && 'border-l-zinc-300 dark:border-l-zinc-700',
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* Field icon */}
                            <div className={cn('mt-0.5 shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl', field.tint)}>
                              <FieldIcon size={15} strokeWidth={2.2} />
                            </div>

                            {/* Body */}
                            <div className="flex-1 min-w-0">
                              {/* Human-readable sentence */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* User pill */}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-200 dark:ring-white/[0.06]">
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">
                                    {initials}
                                  </span>
                                  <span className="max-w-[140px] truncate" title={userName}>{userName}</span>
                                </span>

                                {/* Action verb */}
                                <span className={cn('text-[12px] font-semibold', actionCfg.tint)}>{actionCfg.label}</span>

                                {/* Field badge */}
                                <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold', field.tint)}>
                                  <FieldIcon size={10} strokeWidth={2.5} />
                                  {field.label}
                                </span>

                                {/* Product */}
                                {log.product && (
                                  <>
                                    <span className="text-[12px] text-zinc-400 dark:text-zinc-500">у товара</span>
                                    <Link
                                      href={`/catalog/${log.product.id}`}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[12px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                      <Package size={10} className="shrink-0" />
                                      <span className="max-w-[180px] truncate">{log.product.name}</span>
                                    </Link>
                                    {log.product.sku && (
                                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                        <span className="text-[9px] font-sans font-semibold uppercase tracking-wide text-zinc-400">Арт.</span>
                                        {log.product.sku}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Diff — update */}
                              {log.action === 'update' && (
                                <div className="mt-2.5 flex items-center flex-wrap gap-2 tabular-nums">
                                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-[12.5px] text-red-700 dark:text-red-300">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-red-400 dark:text-red-500">Было</span>
                                    <span className="font-medium line-through decoration-red-400/60 max-w-[160px] truncate">{formatValue(log.field_name, log.old_value)}</span>
                                  </div>
                                  <ArrowRight size={13} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-[12.5px] text-emerald-700 dark:text-emerald-300">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-500">Стало</span>
                                    <span className="font-semibold max-w-[160px] truncate">{formatValue(log.field_name, log.new_value)}</span>
                                  </div>
                                </div>
                              )}

                              {/* Value — create */}
                              {log.action === 'create' && log.new_value && (
                                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-[12.5px] text-emerald-700 dark:text-emerald-300 w-fit">
                                  <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-500">Значение</span>
                                  <span className="font-medium max-w-[200px] truncate">{formatValue(log.field_name, log.new_value)}</span>
                                </div>
                              )}
                            </div>

                            {/* Time */}
                            <time
                              dateTime={log.created_at}
                              title={formatExact(log.created_at)}
                              className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 text-[10px] tabular-nums font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap"
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
