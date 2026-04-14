'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

interface LowStockAlertProps {
  count: number
}

export function LowStockAlert({ count }: LowStockAlertProps) {
  useEffect(() => {
    if (count > 0) {
      toast.warning(`${count} товаров с низким остатком`, {
        description: 'Перейдите в каталог для просмотра',
        duration: 6000,
        icon: <AlertTriangle size={16} />,
      })
    }
  }, [count])

  return null
}
