import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const billing = await getBillingStatusForUser(session.user)
    redirect(billing.hasAccess ? '/connections' : '/billing')
  }

  redirect('/auth/signin')
}
