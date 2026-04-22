'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Rocket,
  Package,
  ShoppingCart,
  Tags,
  Upload,
  LogIn,
  ArrowRight,
} from 'lucide-react'

interface Step {
  id: string
  label: string
  description: string
  href: string
  icon: typeof Package
  roles: ('employee' | 'manager' | 'admin')[]
  /** Checked via real data */
  done?: boolean
}

interface Props {
  role: 'employee' | 'manager' | 'admin'
  productCount: number
  orderCount: number
}

export function OnboardingChecklist({ role, productCount, orderCount }: Props) {
  const [dismissed, setDismissed] = useState(true) // default true to avoid flash
  const [minimized, setMinimized] = useState(false)
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const d = localStorage.getItem('onboarding_dismissed') === 'true'
    const m = localStorage.getItem('onboarding_minimized') === 'true'
    const v = JSON.parse(localStorage.getItem('onboarding_visited') ?? '[]') as string[]
    setDismissed(d)
    setMinimized(m)
    setVisitedSteps(new Set(v))
    setMounted(true)
  }, [])

  function markVisited(id: string) {
    setVisitedSteps((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('onboarding_visited', JSON.stringify([...next]))
      return next
    })
  }

  function dismiss() {
    localStorage.setItem('onboarding_dismissed', 'true')
    setDismissed(true)
  }

  function toggleMinimize() {
    const next = !minimized
    localStorage.setItem('onboarding_minimized', String(next))
    setMinimized(next)
  }

  const allSteps: Step[] = [
    {
      id: 'login',
      label: 'Войти в систему',
      description: 'Вы уже в системе — отлично!',
      href: '/',
      icon: LogIn,
      roles: ['employee', 'manager', 'admin'],
      done: true,
    },
    {
      id: 'catalog',
      label: 'Открыть каталог',
      description: 'Посмотрите все товары на складе',
      href: '/catalog',
      icon: Package,
      roles: ['employee', 'manager', 'admin'],
      done: visitedSteps.has('catalog'),
    },
    {
      id: 'order_create',
      label: 'Оформить первый заказ',
      description: 'Создайте заказ для клиента',
      href: '/orders/new',
      icon: ShoppingCart,
      roles: ['employee', 'manager', 'admin'],
      done: orderCount > 0 || visitedSteps.has('order_create'),
    },
    {
      id: 'product_create',
      label: 'Добавить товар в каталог',
      description: 'Создайте карточку нового товара',
      href: '/products/new',
      icon: Package,
      roles: ['manager', 'admin'],
      done: productCount > 0 || visitedSteps.has('product_create'),
    },
    {
      id: 'categories',
      label: 'Настроить категории',
      description: 'Разбейте товары по категориям',
      href: '/settings',
      icon: Tags,
      roles: ['admin'],
      done: visitedSteps.has('categories'),
    },
    {
      id: 'import',
      label: 'Импортировать товары',
      description: 'Загрузите каталог из Excel-файла',
      href: '/import',
      icon: Upload,
      roles: ['manager', 'admin'],
      done: visitedSteps.has('import'),
    },
  ]

  const steps = allSteps.filter((s) => s.roles.includes(role))
  const doneCount = steps.filter((s) => s.done).length
  const total = steps.length
  const allDone = doneCount === total
  const progress = Math.round((doneCount / total) * 100)

  // Hide if dismissed or all done and user saw it
  if (!mounted || dismissed) return null

  return (
    <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 to-white shadow-sm dark:border-indigo-500/20 dark:from-indigo-950/30 dark:to-zinc-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-indigo-100/80 dark:border-indigo-500/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm shadow-indigo-500/30">
          <Rocket size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-indigo-900 dark:text-indigo-100">
              {allDone ? 'Вы всё настроили!' : 'Быстрый старт'}
            </span>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-600 dark:text-indigo-300">
              {doneCount}/{total}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full max-w-[200px] rounded-full bg-indigo-100 dark:bg-indigo-500/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleMinimize}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            title={minimized ? 'Развернуть' : 'Свернуть'}
          >
            {minimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            title="Скрыть"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!minimized && (
        <ul className="divide-y divide-indigo-100/60 dark:divide-indigo-500/10">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li key={step.id}>
                <Link
                  href={step.href}
                  onClick={() => !step.done && markVisited(step.id)}
                  className={cn(
                    'group flex items-center gap-3 px-5 py-3 transition-colors',
                    step.done
                      ? 'opacity-60 cursor-default pointer-events-none'
                      : 'hover:bg-indigo-50/60 dark:hover:bg-indigo-500/5',
                  )}
                >
                  {/* Step number / done indicator */}
                  <div className="shrink-0">
                    {step.done ? (
                      <CheckCircle2 size={20} className="text-indigo-500 dark:text-indigo-400" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-indigo-200 dark:border-indigo-700 text-[10px] font-bold text-indigo-400 dark:text-indigo-500">
                        {i + 1}
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    step.done
                      ? 'bg-indigo-100/60 dark:bg-indigo-500/10 text-indigo-400'
                      : 'bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20',
                  )}>
                    <Icon size={15} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-[13px] font-medium leading-tight',
                      step.done
                        ? 'text-indigo-400 dark:text-indigo-500 line-through decoration-indigo-300 dark:decoration-indigo-600'
                        : 'text-indigo-900 dark:text-indigo-100',
                    )}>
                      {step.label}
                    </div>
                    {!step.done && (
                      <div className="text-[11px] text-indigo-500/70 dark:text-indigo-400/60 mt-0.5 truncate">
                        {step.description}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {!step.done && (
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-indigo-300 dark:text-indigo-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* All done state */}
      {allDone && !minimized && (
        <div className="px-5 py-4 text-center">
          <p className="text-[13px] text-indigo-600 dark:text-indigo-400 font-medium">
            🎉 Всё готово — система полностью настроена
          </p>
          <button
            onClick={dismiss}
            className="mt-2 text-[12px] text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            Скрыть этот блок
          </button>
        </div>
      )}
    </div>
  )
}
