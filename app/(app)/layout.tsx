import { Sidebar } from '@/components/layout/sidebar'
import { demoProfile } from '@/lib/demo-data'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO: заменить на реальный профиль из Supabase
  const profile = demoProfile

  return (
    <div className="flex h-full">
      <Sidebar role={profile.role} userName={profile.full_name} />
      <main className="flex-1 ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
