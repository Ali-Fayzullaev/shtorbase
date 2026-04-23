import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenuProvider } from '@/components/layout/mobile-menu-context'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ProductTour } from '@/components/onboarding/product-tour'
import { getProfile } from '@/lib/actions/profile'
import { getCompanyBranding } from '@/lib/actions/branding'
import { demoProfile } from '@/lib/demo-data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, branding] = await Promise.all([
    getProfile().then((p) => p ?? demoProfile),
    getCompanyBranding(),
  ])

  return (
    <MobileMenuProvider>
      <div className="flex h-full">
        <Sidebar
          role={profile.role}
          userName={profile.full_name}
          logoUrl={branding.logo_url}
          companyName={branding.company_name}
        />
        <main className="flex-1 min-w-0 overflow-y-auto bg-mesh pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ProductTour role={profile.role} />
    </MobileMenuProvider>
  )
}
