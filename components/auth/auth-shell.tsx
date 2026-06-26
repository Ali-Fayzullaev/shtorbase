import { getCompanyBranding } from '@/lib/data/branding'

interface AuthShellProps {
  children: React.ReactNode
}

export async function AuthShell({ children }: AuthShellProps) {
  const branding = await getCompanyBranding()
  const displayName = branding.company_name || 'ШторБаза'
  const initial = displayName.charAt(0).toUpperCase() || 'Ш'

  return (
    <div className="min-h-svh flex items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {branding.logo_url ? (
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logo_url}
                alt={displayName}
                className="h-full w-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-2xl font-bold shadow-lg shadow-indigo-500/25">
              {initial}
            </div>
          )}
          <p className="text-[15px] font-semibold text-zinc-800 tracking-tight">{displayName}</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm shadow-zinc-200/60 p-6">
          {children}
        </div>

      </div>
    </div>
  )
}

export function AuthShellSkeleton() {
  return <div className="min-h-svh bg-zinc-50" />
}
