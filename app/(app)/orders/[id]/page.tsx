import { Header } from '@/components/layout/header'
import { OrderDetail } from '@/components/orders/order-detail'
import { getOrder, getEmployees } from '@/lib/actions/orders'
import { getOrderStatuses } from '@/lib/actions/settings-data'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { type UserRole } from '@/lib/types/database'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = (profile?.role ?? 'employee') as UserRole

  const [order, employees, orderStatuses] = await Promise.all([
    getOrder(id),
    getEmployees(),
    getOrderStatuses(),
  ])

  if (!order) notFound()

  // Employees can only view orders assigned to them or created by them
  if (userRole === 'employee' && order.assigned_to !== user.id && order.created_by !== user.id) {
    notFound()
  }

  return (
    <>
      <Header title={`Заказ #${order.order_number}`} description={order.client?.name ?? 'Без клиента'}>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
      </Header>

      <div className="p-5">
        <OrderDetail order={order} employees={employees} userRole={userRole} statuses={orderStatuses} />
      </div>
    </>
  )
}
