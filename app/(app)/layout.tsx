import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenuProvider } from '@/components/layout/mobile-menu-context'
import { BottomNav } from '@/components/layout/bottom-nav'
import { getProfile } from '@/lib/actions/profile'
import { getCompanyBranding } from '@/lib/data/branding'
import { demoProfile } from '@/lib/demo-data'

async function SidebarLoader() {
  const [profile, branding] = await Promise.all([
    getProfile().then((p) => p ?? demoProfile),
    getCompanyBranding(),
  ])

  return (
    <Sidebar
      role={profile.role}
      userName={profile.full_name}
      logoUrl={branding.logo_url}
      companyName={branding.company_name}
    />
  )
}

function SidebarSkeleton() {
  return (
    <div className="hidden lg:block w-64 shrink-0 h-full border-r border-white/20 dark:border-white/5 bg-white/70 dark:bg-zinc-950/70">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-2.5 w-20 rounded-md bg-zinc-100/70 dark:bg-zinc-800/70 animate-pulse" />
        </div>
      </div>
      <div className="h-px mx-3 bg-zinc-100 dark:bg-white/[0.06]" />
      <nav className="p-2 pt-3 space-y-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn('h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 animate-pulse', i === 0 && 'mt-5')} />
        ))}
      </nav>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileMenuProvider>
      <div className="flex h-full">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarLoader />
        </Suspense>
        <main className="flex-1 min-w-0 overflow-y-auto bg-mesh pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </MobileMenuProvider>
  )
}
