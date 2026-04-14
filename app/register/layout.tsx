export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      {children}
    </div>
  )
}
