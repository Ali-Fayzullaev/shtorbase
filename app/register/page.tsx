import { isRegistrationAllowed } from '@/lib/actions/settings'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const allowed = await isRegistrationAllowed()
  if (!allowed) redirect('/login')

  return <RegisterForm />
}
