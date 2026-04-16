import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenuProvider } from '@/components/layout/mobile-menu-context'
import { MobileMenuButton } from '@/components/layout/mobile-menu-button'
import { getProfile } from '@/lib/actions/profile'
import { demoProfile } from '@/lib/demo-data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile() ?? demoProfile

  return (
    <MobileMenuProvider>
      <div className="flex h-full">
        <Sidebar role={profile.role} userName={profile.full_name} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-zinc-50/50">
          <MobileMenuButton />
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  )
}
