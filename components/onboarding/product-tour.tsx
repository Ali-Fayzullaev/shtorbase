'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, X, Rocket } from 'lucide-react'
import { type UserRole } from '@/lib/types/database'

interface TourStep {
  selector: string
  title: string
  body: string
  placement?: 'right' | 'left' | 'top' | 'bottom'
  roles?: UserRole[]
}

const STEPS: TourStep[] = [
  { selector: '[data-tour="nav-home"]', title: 'Главная', body: 'Заказы, склад и последние изменения — всё на одной странице.', placement: 'right' },
  { selector: '[data-tour="nav-catalog"]', title: 'Каталог', body: 'Все товары с ценами и остатками. Поиск, фильтры и редактирование.', placement: 'right' },
  { selector: '[data-tour="nav-orders"]', title: 'Заказы', body: 'Создавайте и ведите заказы. Список или доска — по желанию.', placement: 'right' },
  { selector: '[data-tour="nav-new-product"]', title: 'Новый товар', body: 'Пошаговая форма: название, цена, остаток, фото.', placement: 'right', roles: ['manager', 'admin'] },
  { selector: '[data-tour="nav-import"]', title: 'Импорт из Excel', body: 'Загрузите сотни товаров разом по шаблону.', placement: 'right', roles: ['manager', 'admin'] },
]

const KEY = 'shtorbase_tour_v1'
const TT_W = 300
const TT_H = 170
const PAD = 8

interface Rect { top: number; left: number; width: number; height: number }

export function ProductTour({ role }: { role: UserRole }) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'welcome' | 'tour'>('idle')
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const rafRef = useRef<number>(0)

  const steps = STEPS.filter((s) => !s.roles || s.roles.includes(role))
  const step = steps[idx]

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setPhase('welcome'), 400)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const h = () => { setIdx(0); setPhase('welcome') }
    window.addEventListener('shtorbase:start-tour', h)
    return () => window.removeEventListener('shtorbase:start-tour', h)
  }, [])

  useEffect(() => {
    if (phase === 'idle') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [phase])

  const measure = useCallback(() => {
    if (!step) return
    const el = document.querySelector(step.selector) as HTMLElement | null
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  useLayoutEffect(() => {
    if (phase !== 'tour') {
      cancelAnimationFrame(rafRef.current)
      return
    }
    measure()
    const loop = () => {
      measure()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', measure)
    }
  }, [phase, idx, measure])

  function finish() {
    localStorage.setItem(KEY, 'done')
    cancelAnimationFrame(rafRef.current)
    setPhase('idle')
    setRect(null)
  }

  function next() {
    if (idx < steps.length - 1) setIdx((i) => i + 1)
    else finish()
  }

  function back() { if (idx > 0) setIdx((i) => i - 1) }

  if (!mounted || phase === 'idle') return null

  // Welcome modal
  if (phase === 'welcome') {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,15,25,0.45)' }}
      >
        <div className="absolute inset-0" onClick={finish} />
        <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 px-5 pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/30">
              <Rocket size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Добро пожаловать</h2>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{steps.length} коротких шага</p>
            </div>
          </div>

          <p className="px-5 pt-3 pb-5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Давайте быстро покажем, как тут всё работает. Меньше минуты — можно пропустить в любой момент.
          </p>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/60 dark:bg-zinc-950/40">
            <button onClick={finish} className="flex-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              Пропустить
            </button>
            <button onClick={() => setPhase('tour')} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-[12.5px] font-semibold text-white shadow-md shadow-indigo-600/25 transition-colors">
              Начать
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // Tour step
  if (!step) return null

  const hasRect = rect !== null
  const s = hasRect ? { top: rect!.top - PAD, left: rect!.left - PAD, width: rect!.width + PAD * 2, height: rect!.height + PAD * 2 } : null

  // Clip-path cuts a rectangular hole in the blurred overlay
  const clip = s
    ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${s.top}px, ${s.left}px ${s.top}px, ${s.left}px ${s.top + s.height}px, ${s.left + s.width}px ${s.top + s.height}px, ${s.left + s.width}px ${s.top}px, 0 ${s.top}px)`
    : undefined

  // Tooltip position
  let ttStyle: React.CSSProperties = { top: '50%', left: '50%', width: TT_W, transform: 'translate(-50%, -50%)' }
  if (s) {
    const place = step.placement ?? 'right'
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = 0, left = 0
    if (place === 'right') { left = s.left + s.width + 12; top = s.top + s.height / 2 - TT_H / 2 }
    else if (place === 'left') { left = s.left - TT_W - 12; top = s.top + s.height / 2 - TT_H / 2 }
    else if (place === 'bottom') { top = s.top + s.height + 12; left = s.left + s.width / 2 - TT_W / 2 }
    else { top = s.top - TT_H - 12; left = s.left + s.width / 2 - TT_W / 2 }
    if (left + TT_W > vw - 8) {
      left = Math.max(8, vw - TT_W - 8)
      top = s.top + s.height + 12
      if (top + TT_H > vh - 8) top = Math.max(8, s.top - TT_H - 12)
    }
    if (left < 8) left = 8
    if (top < 8) top = 8
    if (top + TT_H > vh - 8) top = Math.max(8, vh - TT_H - 8)
    ttStyle = { top, left, width: TT_W }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9998]">
      {/* Blurred overlay with a rectangular hole */}
      <div
        onClick={finish}
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(15,15,25,0.45)',
          clipPath: clip,
          WebkitClipPath: clip,
          transition: 'clip-path 180ms ease',
        }}
      />

      {/* Highlight ring */}
      {s && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-indigo-400"
          style={{
            top: s.top,
            left: s.left,
            width: s.width,
            height: s.height,
            boxShadow: '0 0 0 3px rgba(255,255,255,0.3), 0 10px 30px -8px rgba(99,102,241,0.5)',
            transition: 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden"
        style={{ ...ttStyle, transition: 'top 180ms ease, left 180ms ease' }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
              {idx + 1} / {steps.length}
            </span>
            <button onClick={finish} className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors">
              <X size={13} />
            </button>
          </div>
          <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{step.body}</p>

          <div className="mt-3 flex items-center gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/60 dark:bg-zinc-950/40">
          <button onClick={finish} className="text-[11.5px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            Пропустить
          </button>
          <div className="flex-1" />
          {idx > 0 && (
            <button onClick={back} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={11} />
              Назад
            </button>
          )}
          <button onClick={next} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors">
            {idx === steps.length - 1 ? 'Готово' : 'Далее'}
            {idx < steps.length - 1 && <ArrowRight size={11} />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function startTour() {
  window.dispatchEvent(new Event('shtorbase:start-tour'))
}
