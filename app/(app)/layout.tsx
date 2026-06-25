import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenuProvider } from '@/components/layout/mobile-menu-context'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ProductTour } from '@/components/onboarding/product-tour'
import { getProfile } from '@/lib/actions/profile'
import { getCompanyBranding } from '@/lib/data/branding'
import { demoProfile } from '@/lib/demo-data'
import { type UserRole } from '@/lib/types/database'

// Async server component that resolves sidebar data
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

// Sidebar skeleton while data loads (only on very first cold load)
function SidebarSkeleton() {
  return (
    <div className="hidden lg:flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-3 border-b border-zinc-100 px-4 dark:border-white/[0.05]">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 animate-pulse" />
        ))}
      </nav>
    </div>
  )
}

async function ProductTourLoader() {
  const profile = await getProfile()
  if (!profile) return null
  return <ProductTour role={profile.role as UserRole} />
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
      <BottomNav />
      <Suspense fallback={null}>
        <ProductTourLoader />
      </Suspense>
    </MobileMenuProvider>
  )
}
