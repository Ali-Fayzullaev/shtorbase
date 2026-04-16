import { getOrder } from '@/lib/actions/orders'
import { getOrderStatuses } from '@/lib/actions/settings-data'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PrintOrderView } from '@/components/orders/print-order-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PrintOrderPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [order, statuses] = await Promise.all([getOrder(id), getOrderStatuses()])
  if (!order) notFound()

  const statusMap: Record<string, string> = {}
  for (const s of statuses) statusMap[s.slug] = s.label

  return <PrintOrderView order={order} statusLabel={statusMap[order.status] ?? order.status} />
}
