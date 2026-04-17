'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

export function ResponsiveToaster() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return <Toaster position={mobile ? 'top-center' : 'top-right'} richColors closeButton />
}
