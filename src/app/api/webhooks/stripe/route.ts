import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { PLANS } from '@/lib/platform-rules'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan as keyof typeof PLANS

    if (!userId || !plan || !PLANS[plan]) {
      console.error('Missing metadata in checkout session:', session.id)
      return NextResponse.json({ received: true })
    }

    const planConfig = PLANS[plan]
    const creditsLimit = planConfig.credits === -1 ? -1 : planConfig.credits

    // Retrieve subscription details
    const subscriptionId = session.subscription as string
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const { error } = await supabase
      .from('listing_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        plan,
        credits_used: 0,
        credits_limit: creditsLimit,
        period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        status: 'active'
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to save subscription:', error)
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) return NextResponse.json({ received: true })

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.userId

    if (!userId) return NextResponse.json({ received: true })

    // Reset credits on renewal
    await supabase
      .from('listing_subscriptions')
      .update({
        credits_used: 0,
        period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('user_id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      await supabase
        .from('listing_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
