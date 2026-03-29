'use server'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'
import {
  getAppUrl,
  getAvailablePlans,
  getBillingStatusForUser,
  getOrCreateStripeCustomer,
  getTrialDays,
  isBillingConfigured,
} from '@/lib/billing'
import { getStripeClient } from '@/lib/stripe'

function getRequiredSession() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user?.email) {
      throw new Error('Unauthorized')
    }

    return session
  })
}

function findPlanByKey(planKey) {
  const plans = getAvailablePlans()
  const selected = plans.find((plan) => plan.key === planKey)

  if (!selected) {
    throw new Error(`Unknown plan "${planKey}"`)
  }

  return selected
}

function getDefaultPlan() {
  const plans = getAvailablePlans()

  if (!plans.length) {
    throw new Error(
      'No Stripe prices configured. Set STRIPE_PRICE_MONTHLY or STRIPE_PRICE_YEARLY.'
    )
  }

  return plans[0]
}

export async function getBillingStatusAction() {
  const session = await getRequiredSession()
  return getBillingStatusForUser(session.user)
}

export async function createCheckoutSessionAction(formData) {
  if (!isBillingConfigured()) {
    throw new Error(
      'Stripe billing is not configured. Set STRIPE_SECRET_KEY, one Stripe price ID, and NEXTAUTH_URL.'
    )
  }

  const session = await getRequiredSession()
  const planKey = String(formData.get('plan') || '')
  const plan = planKey ? findPlanByKey(planKey) : getDefaultPlan()
  const stripe = getStripeClient()
  const customer = await getOrCreateStripeCustomer({
    email: session.user.email,
    name: session.user.name,
  })
  const appUrl = getAppUrl()
  const trialDays = getTrialDays()

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    allow_promotion_codes: true,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    ...(trialDays > 0
      ? {
          subscription_data: {
            trial_period_days: trialDays,
          },
        }
      : {}),
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=cancel`,
  })

  if (!checkoutSession.url) {
    throw new Error('Stripe checkout session was created without a URL')
  }

  redirect(checkoutSession.url)
}

export async function openBillingPortalAction() {
  if (!isBillingConfigured()) {
    throw new Error(
      'Stripe billing is not configured. Set STRIPE_SECRET_KEY, one Stripe price ID, and NEXTAUTH_URL.'
    )
  }

  const session = await getRequiredSession()
  const billing = await getBillingStatusForUser(session.user)
  const stripe = getStripeClient()
  const appUrl = getAppUrl()

  if (!billing.customerId) {
    const fallbackPlan = getDefaultPlan()
    const fakeFormData = new FormData()
    fakeFormData.set('plan', fallbackPlan.key)
    return createCheckoutSessionAction(fakeFormData)
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: billing.customerId,
    return_url: `${appUrl}/billing`,
  })

  redirect(portalSession.url)
}
