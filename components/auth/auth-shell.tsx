import Link from 'next/link'
import { getCompanyBranding } from '@/lib/actions/branding'
import { Boxes, LineChart, ShieldCheck } from 'lucide-react'

interface AuthShellProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footer?: React.ReactNode
  illustration?: string
}

export async function AuthShell({ children, title, subtitle, footer, illustration }: AuthShellProps) {
  const branding = await getCompanyBranding()
  const displayName = branding.company_name || 'ШторБаза'
  const initial = displayName.charAt(0).toUpperCase() || 'Ш'

  return (
    <div className="min-h-svh grid lg:grid-cols-[1.05fr_1fr] bg-white dark:bg-zinc-950">
      {/* LEFT — Brand panel: dark graphite with subtle animated aurora */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white">
        {/* Base gradient layer */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#1a1530]" />

        {/* Animated aurora blobs — soft and slow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-[100px] animate-aurora-1" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-500/15 blur-[110px] animate-aurora-2" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[22rem] w-[22rem] rounded-full bg-fuchsia-500/10 blur-[100px] animate-aurora-3" />

        {/* Animated subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] animate-grid-pan"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top edge glow */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          {branding.logo_url ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/95 ring-1 ring-white/20 shadow-md shadow-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.logo_url} alt={displayName} className="h-full w-full object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-base font-bold shadow-md shadow-black/30">
              {initial}
            </div>
          )}
          <div>
            <p className="text-[14px] font-semibold leading-tight">{displayName}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-0.5">Inventory Platform</p>
          </div>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10 max-w-sm space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/10 text-white/80">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Система активна
          </div>
          <h2 className="text-[26px] font-semibold leading-[1.2] tracking-tight text-white/95">
            Всё про товары, заказы и остатки —{' '}
            <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              в одном месте
            </span>
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed">
            Современный учёт штор и тканей для команды: каталог с фото, заказы клиентов и история изменений.
          </p>

          {illustration && (
            <div className="relative py-4 animate-float">
              {/* Soft glow behind illustration */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={illustration}
                alt=""
                aria-hidden="true"
                className="relative mx-auto h-48 w-auto max-w-full object-contain drop-shadow-[0_10px_40px_rgba(99,102,241,0.25)]"
              />
            </div>
          )}

          <ul className="space-y-2.5 pt-1">
            {[
              { icon: Boxes, text: 'Каталог с фото, ценами и остатками' },
              { icon: LineChart, text: 'Аудит изменений по каждому действию' },
              { icon: ShieldCheck, text: 'Ролевой доступ и enterprise-безопасность' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 text-white/70">
                  <Icon size={12} />
                </span>
                <span className="text-white/75">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: footer */}
        <div className="relative z-10 text-[11px] text-white/40">
          © {new Date().getFullYear()} {displayName}
        </div>
      </aside>

      {/* RIGHT — Form */}
      <main className="flex min-h-svh items-center justify-center px-6 py-10 sm:px-10 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-[380px]">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-5 flex items-center justify-center gap-2.5">
            {branding.logo_url ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={branding.logo_url} alt={displayName} className="h-full w-full object-contain p-1" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-base font-bold shadow-sm">
                {initial}
              </div>
            )}
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{displayName}</p>
          </div>

          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>

          {children}

          {footer && (
            <p className="mt-5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">{footer}</p>
          )}
        </div>
      </main>
    </div>
  )
}

export function AuthShellSkeleton() {
  return <div className="min-h-svh bg-zinc-50 dark:bg-zinc-950" />
}

export { Link }
