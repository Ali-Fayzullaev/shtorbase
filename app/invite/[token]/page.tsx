import { Suspense } from 'react'
import { AcceptInviteForm } from './accept-invite-form'

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <Suspense>
      <AcceptInviteForm token={token} />
    </Suspense>
  )
}
