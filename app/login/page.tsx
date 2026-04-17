import { isRegistrationAllowed } from '@/lib/actions/settings'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const regAllowed = await isRegistrationAllowed()
  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить работу с каталогом и заказами"
      illustration="/login.svg"
    >
      <LoginForm showRegister={regAllowed} />
    </AuthShell>
  )
}
