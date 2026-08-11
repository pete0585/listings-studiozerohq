'use client'

import Link from 'next/link'
import { useState } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    credits: 50,
    priceId: 'price_1U3KvxK3jIV2QCJnh6vZDsn9',
    description: 'Perfect for testing the waters',
    features: [
      '50 listings per month',
      'All 4 platforms',
      'Full platform rules enforcement',
      'Export / copy all fields',
      'Generation history'
    ],
    highlighted: false
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    credits: 200,
    priceId: 'price_1U3KvyK3jIV2QCJnrIXvcNGo',
    description: 'For active sellers scaling their catalog',
    features: [
      '200 listings per month',
      'All 4 platforms',
      'Full platform rules enforcement',
      'Export / copy all fields',
      'Generation history',
      'Priority support'
    ],
    highlighted: true
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 149,
    credits: -1,
    priceId: 'price_1U3KvzK3jIV2QCJnnF6R4SFx',
    description: 'Unlimited for power sellers and agencies',
    features: [
      'Unlimited listings',
      'All 4 platforms',
      'Full platform rules enforcement',
      'Export / copy all fields',
      'Complete generation history',
      'Priority support',
      'API access (coming soon)'
    ],
    highlighted: false
  }
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!email && showEmailInput !== planId) {
      setShowEmailInput(planId)
      return
    }

    setLoading(planId)
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email })
      })
      const data = await resp.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="font-bold text-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ListingAI
          </Link>
          <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa' }}>
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#f0f0f5' }}>Simple, transparent pricing</h1>
          <p className="text-lg" style={{ color: '#888' }}>Start free. Pay only when you need more.</p>
        </div>

        {/* Free tier */}
        <div className="rounded-xl p-5 mb-8 text-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="font-semibold" style={{ color: '#a78bfa' }}>🎉 Try it free — no account required</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Get 1 free generation per browser session. No credit card needed.</p>
          <Link href="/" className="inline-block mt-3 text-sm px-5 py-2 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a78bfa' }}>
            Try it now →
          </Link>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map(plan => (
            <div key={plan.id} className="rounded-2xl p-6 flex flex-col"
              style={{
                background: plan.highlighted ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                border: plan.highlighted ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                position: 'relative'
              }}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold mb-1" style={{ color: '#f0f0f5' }}>{plan.name}</h2>
              <p className="text-sm mb-4" style={{ color: '#888' }}>{plan.description}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold" style={{ color: '#f0f0f5' }}>${plan.price}</span>
                <span className="text-sm" style={{ color: '#888' }}>/month</span>
              </div>
              <div className="text-sm mb-6" style={{ color: plan.highlighted ? '#a78bfa' : '#6366f1', fontWeight: 600 }}>
                {plan.credits === -1 ? 'Unlimited listings' : `${plan.credits} listings/month`}
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#ccc' }}>
                    <span style={{ color: '#6366f1', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {showEmailInput === plan.id ? (
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full mb-3"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }}
                  />
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id || !email}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{
                      background: plan.highlighted ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.3)',
                      border: plan.highlighted ? 'none' : '1px solid rgba(99,102,241,0.4)',
                      cursor: loading === plan.id || !email ? 'not-allowed' : 'pointer',
                      opacity: !email ? 0.6 : 1
                    }}>
                    {loading === plan.id ? 'Redirecting...' : 'Continue to checkout →'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: plan.highlighted ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.3)',
                    border: plan.highlighted ? 'none' : '1px solid rgba(99,102,241,0.4)',
                    cursor: loading === plan.id ? 'not-allowed' : 'pointer'
                  }}>
                  {loading === plan.id ? 'Redirecting...' : `Get ${plan.name}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#f0f0f5' }}>FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'What counts as a listing generation?', a: 'Each time you click "Generate" counts as one credit, regardless of how many platforms you select. Generating for all 4 platforms at once = 1 credit.' },
              { q: 'What happens when I run out of credits?', a: 'You can upgrade your plan or wait for your monthly reset. Credits reset at the start of each billing period.' },
              { q: 'What model does ListingAI use?', a: 'We use Claude Haiku — Anthropic\'s fast, capable model optimized for structured output. All platform character limits are enforced in the prompt.' },
              { q: 'Is this in test mode?', a: 'Yes — Stripe is currently in test mode. No real charges will occur. Use card 4242 4242 4242 4242 to test.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard. You keep access until the end of your billing period.' }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-medium mb-2" style={{ color: '#f0f0f5' }}>{item.q}</p>
                <p className="text-sm" style={{ color: '#888' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
