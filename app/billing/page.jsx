import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  createCheckoutSessionAction,
  openBillingPortalAction,
} from '@/actions/billing'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import authOptions from '@/lib/auth-options'
import {
  getAvailablePlans,
  getBillingStatusForUser,
  getTrialDays,
  isBillingConfigured,
} from '@/lib/billing'

function formatDate(dateValue) {
  if (!dateValue) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(dateValue)
}

function statusLabel(status) {
  const value = String(status || '').replace(/_/g, ' ')
  return value ? value[0].toUpperCase() + value.slice(1) : 'Unknown'
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const billingConfigured = isBillingConfigured()
  const billing = await getBillingStatusForUser(session.user)
  const plans = getAvailablePlans()
  const trialDays = getTrialDays()

  return (
    <main className="min-h-screen p-6 md:p-10 bg-muted/20">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage your subscription, free trial, and payment settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Current status:</span>{' '}
              {statusLabel(billing.status)}
            </p>
            <p>
              <span className="font-medium">Plan:</span>{' '}
              {billing.planName || 'No plan yet'}
            </p>
            <p>
              <span className="font-medium">Trial ends:</span>{' '}
              {formatDate(billing.trialEndsAt)}
            </p>
            <p>
              <span className="font-medium">Current period ends:</span>{' '}
              {formatDate(billing.currentPeriodEndsAt)}
            </p>
            <p>
              <span className="font-medium">Cancel at period end:</span>{' '}
              {billing.cancelAtPeriodEnd ? 'Yes' : 'No'}
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            {billing.hasAccess ? (
              <>
                <form action={openBillingPortalAction}>
                  <Button type="submit">Manage Subscription</Button>
                </form>
                <Button asChild variant="outline">
                  <Link href="/connections">Back to Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                {plans.map((plan) => (
                  <form action={createCheckoutSessionAction} key={plan.key}>
                    <input type="hidden" name="plan" value={plan.key} />
                    <Button type="submit">
                      Start {plan.label}
                      {trialDays > 0 ? ` (${trialDays}-day trial)` : ''}
                    </Button>
                  </form>
                ))}
              </>
            )}
          </CardFooter>
        </Card>

        {!billingConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle>Stripe Not Configured</CardTitle>
              <CardDescription>
                Set Stripe environment variables to enforce paid access.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <code>STRIPE_SECRET_KEY</code>
              </p>
              <p>
                <code>STRIPE_PRICE_MONTHLY</code>
              </p>
              <p>
                <code>STRIPE_PRICE_YEARLY</code> (optional)
              </p>
              <p>
                <code>STRIPE_WEBHOOK_SECRET</code> (for webhook validation)
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
