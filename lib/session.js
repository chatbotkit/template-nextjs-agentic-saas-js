import 'server-only'

import { getServerSession } from 'next-auth'

import authOptions from '@/lib/auth-options'
import { getBillingStatusForUser } from '@/lib/billing'

/**
 * Returns the authenticated session or throws.
 *
 * Validates both authentication and billing status.
 *
 * @returns {Promise<{ session: object, billing: object }>}
 * @throws {Error} If the user is not authenticated or has no active subscription
 */
export async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  const billing = await getBillingStatusForUser(session.user)

  if (!billing.hasAccess) {
    throw new Error('Subscription required')
  }

  return { session, billing }
}
