import { isRegistrationAllowed } from '@/lib/actions/settings'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const allowed = await isRegistrationAllowed()
  if (!allowed) redirect('/login')

  return (
    <AuthShell
      title="Создайте аккаунт"
      subtitle="Несколько полей — и вы внутри. Доступ активируется после подтверждения администратором"
      illustration="/register.svg"
    >
      <RegisterForm />
    </AuthShell>
  )
}
