'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Generation {
  id: string
  product_name: string
  platforms: string[]
  created_at: string
  output_data: Record<string, unknown>
}

interface Subscription {
  plan: string
  credits_used: number
  credits_limit: number
  status: string
  period_end: string
}

const PLATFORM_ICONS: Record<string, string> = {
  amazon: '🛒', etsy: '🎨', shopify: '🏪', ebay: '🔵'
}

const PLAN_DISPLAY: Record<string, string> = {
  starter: 'Starter ($49/mo)',
  growth: 'Growth ($99/mo)',
  scale: 'Scale ($149/mo)'
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null)
  const [activeTab, setActiveTab] = useState('amazon')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
      if (session?.user) {
        fetchData(session.access_token)
      }
    })

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchData(session.access_token)
      }
    })

    return () => authSub.unsubscribe()
  }, [])

  const fetchData = async (token: string) => {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const [histResp, subResp] = await Promise.all([
      fetch('/api/history', { headers }),
      fetch('/api/subscription', { headers })
    ])

    if (histResp.ok) {
      const data = await histResp.json()
      setGenerations(data.generations || [])
    }
    if (subResp.ok) {
      const data = await subResp.json()
      setSubscription(data.subscription)
    }
  }

  const handleSendMagicLink = async () => {
    if (!email) return
    try {
      const resp = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (resp.ok) setMagicLinkSent(true)
    } catch { /* ignore */ }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setGenerations([])
    setSubscription(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </main>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <main className="min-h-screen" style={{ background: '#0a0a0f' }}>
        <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="font-bold text-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ListingAI
            </Link>
            <Link href="/pricing" style={{ color: '#aaa', fontSize: 14 }}>Pricing</Link>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#f0f0f5' }}>Sign in to your dashboard</h1>
          <p className="text-sm mb-8" style={{ color: '#888' }}>Enter your email and we will send you a sign-in link.</p>

          {magicLinkSent ? (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <p style={{ color: '#a78bfa' }}>Check your email for your sign-in link!</p>
              <p className="text-sm mt-2" style={{ color: '#888' }}>The link expires in 1 hour.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleSendMagicLink()}
                className="w-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '12px 16px' }}
              />
              <button onClick={handleSendMagicLink}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: 'pointer' }}>
                Send sign-in link
              </button>
            </div>
          )}

          <p className="mt-6 text-sm" style={{ color: '#555' }}>
            No account yet? <Link href="/" style={{ color: '#6366f1' }}>Try it free →</Link>
          </p>
        </div>
      </main>
    )
  }

  // Logged in
  const creditsDisplay = subscription
    ? subscription.credits_limit === -1
      ? 'Unlimited'
      : `${subscription.credits_used} / ${subscription.credits_limit} used`
    : 'No active plan'

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="font-bold text-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ListingAI
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#888' }}>{user.email}</span>
            <button onClick={handleSignOut} className="text-sm px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm mb-1" style={{ color: '#888' }}>Current Plan</p>
            <p className="font-semibold" style={{ color: '#f0f0f5' }}>
              {subscription ? PLAN_DISPLAY[subscription.plan] || subscription.plan : 'Free'}
            </p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm mb-1" style={{ color: '#888' }}>Credits This Month</p>
            <p className="font-semibold" style={{ color: '#f0f0f5' }}>{creditsDisplay}</p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm mb-1" style={{ color: '#888' }}>Total Listings Generated</p>
            <p className="font-semibold" style={{ color: '#f0f0f5' }}>{generations.length}</p>
          </div>
        </div>

        {/* Upgrade prompt */}
        {!subscription && (
          <div className="rounded-xl p-5 mb-8" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <p className="font-semibold mb-1" style={{ color: '#a78bfa' }}>You are on the free plan</p>
            <p className="text-sm mb-3" style={{ color: '#888' }}>Upgrade to save unlimited listings and get more monthly generations.</p>
            <Link href="/pricing" className="inline-block text-sm px-4 py-2 rounded-lg font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              View plans →
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: '#f0f0f5' }}>Generation History</h2>
          <Link href="/" className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            + New Listing
          </Link>
        </div>

        {generations.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl mb-3">📋</p>
            <p className="font-medium mb-2" style={{ color: '#888' }}>No listings yet</p>
            <p className="text-sm mb-6" style={{ color: '#555' }}>Generate your first product listing to see it here.</p>
            <Link href="/" className="inline-block text-sm px-5 py-2 rounded-lg font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Generate a listing →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map(gen => (
              <div key={gen.id}
                className="p-4 rounded-xl cursor-pointer"
                style={{ background: selectedGen?.id === gen.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: selectedGen?.id === gen.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)' }}
                onClick={() => {
                  if (selectedGen?.id === gen.id) {
                    setSelectedGen(null)
                  } else {
                    setSelectedGen(gen)
                    setActiveTab(gen.platforms[0])
                  }
                }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium" style={{ color: '#f0f0f5' }}>{gen.product_name}</p>
                    <div className="flex gap-2 mt-1">
                      {gen.platforms.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}>
                          {PLATFORM_ICONS[p]} {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: '#555' }}>
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded view */}
                {selectedGen?.id === gen.id && (
                  <div className="mt-4" onClick={e => e.stopPropagation()}>
                    <div className="flex overflow-x-auto mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {gen.platforms.map(p => (
                        <button key={p} onClick={() => setActiveTab(p)}
                          className="px-4 py-2 text-sm whitespace-nowrap"
                          style={{ borderBottom: activeTab === p ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === p ? '#a78bfa' : '#666', background: 'transparent', cursor: 'pointer' }}>
                          {PLATFORM_ICONS[p]} {p}
                        </button>
                      ))}
                    </div>

                    <HistoryPlatformView platform={activeTab} data={gen.output_data[activeTab] as Record<string, unknown>} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function HistoryPlatformView({ platform, data }: { platform: string; data: Record<string, unknown> | undefined }) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!data) return <p style={{ color: '#888', fontSize: 14 }}>No data for this platform.</p>

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const TextField = ({ label, value, fieldId }: { label: string; value: string; fieldId: string }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: '#888' }}>{label}</span>
        <button onClick={() => copy(value, fieldId)} style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>
          {copied === fieldId ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-2 rounded text-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', color: '#ddd' }}>{value}</div>
    </div>
  )

  if (platform === 'amazon') {
    const d = data as { title: string; bullets: string[]; description: string; backend_keywords: string }
    return (
      <div>
        <TextField label="Title" value={d.title} fieldId="h-amazon-title" />
        {d.bullets?.map((b, i) => <TextField key={i} label={`Bullet ${i + 1}`} value={b} fieldId={`h-bullet-${i}`} />)}
        <TextField label="Backend Keywords" value={d.backend_keywords} fieldId="h-backend" />
      </div>
    )
  }
  if (platform === 'etsy') {
    const d = data as { title: string; tags: string[]; description: string }
    return (
      <div>
        <TextField label="Title" value={d.title} fieldId="h-etsy-title" />
        <div className="mb-3">
          <span className="text-xs font-medium" style={{ color: '#888' }}>Tags</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {d.tags?.map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}>{t}</span>)}
          </div>
        </div>
      </div>
    )
  }
  if (platform === 'shopify') {
    const d = data as { title: string; meta_description: string; description: string }
    return (
      <div>
        <TextField label="SEO Title" value={d.title} fieldId="h-sh-title" />
        <TextField label="Meta Description" value={d.meta_description} fieldId="h-sh-meta" />
      </div>
    )
  }
  if (platform === 'ebay') {
    const d = data as { title: string; description: string }
    return <TextField label="Title" value={d.title} fieldId="h-ebay-title" />
  }
  return null
}
