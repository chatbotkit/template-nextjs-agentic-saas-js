import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { getStripeClient } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request) {
  const stripeSignature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  if (!stripeSignature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const payload = await request.text()
  const stripe = getStripeClient()

  let event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      stripeSignature,
      webhookSecret
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid webhook signature: ${error.message}` },
      { status: 400 }
    )
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'checkout.session.completed':
      revalidatePath('/billing')
      revalidatePath('/chat')
      revalidatePath('/connections')
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
