'use client'

interface HeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
          {description && (
            <span className="text-[13px] text-slate-400">{description}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </header>
  )
}
