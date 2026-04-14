'use client'

import { Bell, LogOut } from 'lucide-react'

interface HeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-background hover:text-foreground transition-colors">
            <Bell size={18} />
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-background hover:text-foreground transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
