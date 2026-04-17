import { Header } from '@/components/layout/header'
import { OrderForm } from '@/components/orders/order-form'
import { getClients } from '@/lib/actions/clients'
import { getEmployees } from '@/lib/actions/orders'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NewOrderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [clients, employees] = await Promise.all([
    getClients(),
    getEmployees(),
  ])

  return (
    <>
      <Header title="Новый заказ" description="Создание заказа">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>
      </Header>

      <div className="p-5">
        <div className="rounded-xl glass-card p-5 sm:p-6">
          <OrderForm clients={clients} employees={employees} userRole={profile.role} />
        </div>
      </div>
    </>
  )
}
