import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
