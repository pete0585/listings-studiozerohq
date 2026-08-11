import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { PLANS } from '@/lib/platform-rules'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, userId, email } = body

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const planConfig = PLANS[plan as keyof typeof PLANS]
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://listings.studiozerohq.com'

    // Create or retrieve Stripe customer
    const supabase = createServiceClient()
    let stripeCustomerId: string | undefined

    if (userId) {
      const { data: sub } = await supabase
        .from('listing_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()

      stripeCustomerId = sub?.stripe_customer_id || undefined
    }

    if (!stripeCustomerId && email) {
      const customer = await stripe.customers.create({ email })
      stripeCustomerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${siteUrl}/pricing?cancelled=true`,
      metadata: {
        userId: userId || '',
        plan
      },
      subscription_data: {
        metadata: {
          userId: userId || '',
          plan
        }
      }
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
