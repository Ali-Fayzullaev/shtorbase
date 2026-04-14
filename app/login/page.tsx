import { isRegistrationAllowed } from '@/lib/actions/settings'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const regAllowed = await isRegistrationAllowed()
  return <LoginForm showRegister={regAllowed} />
}
