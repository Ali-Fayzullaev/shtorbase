import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenuProvider } from '@/components/layout/mobile-menu-context'
import { BottomNav } from '@/components/layout/bottom-nav'
import { CartProvider, CartPanel } from '@/components/catalog/catalog-cart'
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
    <div className="hidden lg:block w-60 shrink-0 h-full border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
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
          <div key={i} className="h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 animate-pulse" />
        ))}
      </nav>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
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
        <CartPanel />
      </MobileMenuProvider>
    </CartProvider>
  )
}
