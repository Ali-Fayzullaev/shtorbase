'use client'

interface HeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0 pl-10 lg:pl-0">
          <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
          {description && (
            <span className="hidden sm:inline text-sm text-slate-400 shrink-0">{description}</span>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
