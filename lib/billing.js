import 'server-only'

import { getStripeClient } from '@/lib/stripe'

const ACCESS_STATUSES = new Set(['active', 'trialing', 'past_due'])

function toDate(epochSeconds) {
  if (!epochSeconds) {
    return null
  }

  return new Date(epochSeconds * 1000)
}

function getPlanName(subscription) {
  const lineItem = subscription?.items?.data?.[0]
  const price = lineItem?.price
  const product = price?.product

  if (price?.nickname) {
    return price.nickname
  }

  if (typeof product === 'object' && product?.name) {
    return product.name
  }

  return price?.id || 'Subscription'
}

function getSubscriptionPriority(status) {
  if (status === 'active') return 3
  if (status === 'trialing') return 2
  if (status === 'past_due') return 1
  return 0
}

function pickMostRelevantSubscription(subscriptions) {
  if (!subscriptions?.length) {
    return null
  }

  return [...subscriptions].sort((a, b) => {
    const statusDiff =
      getSubscriptionPriority(b.status) - getSubscriptionPriority(a.status)

    if (statusDiff !== 0) {
      return statusDiff
    }

    return (b.current_period_end || 0) - (a.current_period_end || 0)
  })[0]
}

export function isBillingConfigured() {
  const hasAnyPrice = Boolean(
    process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_YEARLY
  )

  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      hasAnyPrice &&
      process.env.NEXTAUTH_URL
  )
}

export function isBillingRequired() {
  return process.env.BILLING_REQUIRED === 'true'
}

export async function findStripeCustomerByEmail(email) {
  const stripe = getStripeClient()
  const { data } = await stripe.customers.list({
    email,
    limit: 10,
  })

  const exactMatches = data.filter(
    (customer) =>
      !customer.deleted && customer.email?.toLowerCase() === email.toLowerCase()
  )

  if (!exactMatches.length) {
    return null
  }

  return exactMatches.sort((a, b) => (b.created || 0) - (a.created || 0))[0]
}

export async function getOrCreateStripeCustomer({ email, name }) {
  const stripe = getStripeClient()
  const existing = await findStripeCustomerByEmail(email)

  if (existing) {
    return existing
  }

  return stripe.customers.create({
    email,
    name: name || undefined,
  })
}

export async function getBillingStatusForUser(user) {
  if (!user?.email) {
    return {
      billingConfigured: isBillingConfigured(),
      hasAccess: false,
      status: 'missing_email',
      planName: null,
      customerId: null,
      subscriptionId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
    }
  }

  if (!isBillingConfigured()) {
    const billingRequired = isBillingRequired()

    return {
      billingConfigured: false,
      hasAccess: !billingRequired,
      status: billingRequired ? 'not_configured_blocked' : 'not_configured',
      planName: null,
      customerId: null,
      subscriptionId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      billingRequired,
    }
  }

  const stripe = getStripeClient()
  const customer = await findStripeCustomerByEmail(user.email)

  if (!customer) {
    return {
      billingConfigured: true,
      hasAccess: false,
      status: 'no_subscription',
      planName: null,
      customerId: null,
      subscriptionId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      billingRequired: isBillingRequired(),
    }
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 20,
  })

  const subscription = pickMostRelevantSubscription(subscriptions.data)

  if (!subscription) {
    return {
      billingConfigured: true,
      hasAccess: false,
      status: 'no_subscription',
      planName: null,
      customerId: customer.id,
      subscriptionId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
    }
  }

  return {
    billingConfigured: true,
    hasAccess: ACCESS_STATUSES.has(subscription.status),
    status: subscription.status,
    planName: getPlanName(subscription),
    customerId: customer.id,
    subscriptionId: subscription.id,
    trialEndsAt: toDate(subscription.trial_end),
    currentPeriodEndsAt: toDate(subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    billingRequired: isBillingRequired(),
  }
}

export function getAvailablePlans() {
  return [
    {
      key: 'monthly',
      label: 'Monthly',
      priceId: process.env.STRIPE_PRICE_MONTHLY || '',
    },
    {
      key: 'yearly',
      label: 'Yearly',
      priceId: process.env.STRIPE_PRICE_YEARLY || '',
    },
  ].filter((plan) => Boolean(plan.priceId))
}

export function getTrialDays() {
  const raw = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10)

  if (Number.isNaN(raw) || raw < 0) {
    return 0
  }

  return raw
}

export function getAppUrl() {
  const appUrl = process.env.NEXTAUTH_URL

  if (!appUrl) {
    throw new Error('Missing NEXTAUTH_URL')
  }

  return appUrl.replace(/\/$/, '')
}
