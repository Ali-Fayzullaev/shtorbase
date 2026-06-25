import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить работу с каталогом и заказами"
      illustration="/login.svg"
    >
      <LoginForm />
    </AuthShell>
  )
}
