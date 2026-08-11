'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLATFORMS = [
  { id: 'amazon', label: 'Amazon', icon: '🛒' },
  { id: 'etsy', label: 'Etsy', icon: '🎨' },
  { id: 'shopify', label: 'Shopify', icon: '🏪' },
  { id: 'ebay', label: 'eBay', icon: '🔵' }
]

function getSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('plg_session')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('plg_session', sid)
  }
  return sid
}

export default function HomePage() {
  const [form, setForm] = useState({
    productName: '', category: '', keyFeatures: '', targetAudience: '',
    materials: '', dimensions: '', price: '', keywords: ''
  })
  const [platforms, setPlatforms] = useState<string[]>(['amazon'])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<string>('amazon')
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authSent, setAuthSent] = useState(false)

  const togglePlatform = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    if (!form.productName.trim()) { setError('Product name is required'); return }
    if (platforms.length === 0) { setError('Select at least one platform'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, platforms, sessionId: getSessionId() })
      })
      const data = await resp.json()
      if (!resp.ok) {
        if (data.error === 'free_limit_reached') { setShowAuth(true); setLoading(false); return }
        setError(data.error || data.message || 'Generation failed')
      } else {
        setResult(data.output)
        setActiveTab(platforms[0])
      }
    } catch { setError('Network error — please try again') }
    setLoading(false)
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSendMagicLink = async () => {
    if (!authEmail) return
    try {
      const resp = await fetch('/api/auth/magic-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      })
      if (resp.ok) setAuthSent(true)
    } catch { setError('Failed to send sign-in link') }
  }

  const amazonData = result?.amazon as Record<string, unknown> | undefined
  const etsyData = result?.etsy as Record<string, unknown> | undefined
  const shopifyData = result?.shopify as Record<string, unknown> | undefined
  const ebayData = result?.ebay as Record<string, unknown> | undefined
  const seoKeywords = result?.seo_keywords as string[] | undefined

  const inp = (field: string, value: string, placeholder: string, onChange: (v: string) => void) => (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px', outline: 'none' }} />
  )

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.9)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ListingAI
          </span>
          <div className="flex gap-4 items-center">
            <Link href="/pricing" className="text-sm" style={{ color: '#aaa' }}>Pricing</Link>
            <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa' }}>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa' }}>
          AI-powered listing optimization
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ lineHeight: 1.2 }}>
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Perfect listings
          </span>
          <br />
          <span style={{ color: '#f0f0f5' }}>for every platform</span>
        </h1>
        <p className="text-lg mb-6" style={{ color: '#888' }}>
          Enter your product details once. Get optimized listings for Amazon, Etsy, Shopify, and eBay — every character limit enforced, every rule followed.
        </p>
        <div className="flex flex-wrap gap-4 justify-center text-sm mb-12" style={{ color: '#666' }}>
          <span>✓ First generation free</span>
          <span>✓ No account required</span>
          <span>✓ All platform rules enforced</span>
        </div>
      </div>

      {/* Generator */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#f0f0f5' }}>Product Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Product Name <span style={{ color: '#6366f1' }}>*</span></label>
              <input type="text" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="e.g., Organic Lavender Soy Candle"
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Category</label>
              <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g., Home & Garden, Candles"
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Key Features &amp; Benefits <span style={{ color: '#555', fontWeight: 400 }}>(one per line)</span></label>
            <textarea value={form.keyFeatures} onChange={e => setForm(f => ({ ...f, keyFeatures: e.target.value }))}
              placeholder={"100% organic soy wax\nHand-poured in small batches\n60-hour burn time\nRelaxing lavender scent"} rows={4}
              className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px', resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Target Audience</label>
              <input type="text" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="e.g., Women 25-45, home decor fans"
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Materials / Ingredients</label>
              <input type="text" value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} placeholder="e.g., Soy wax, cotton wick, lavender EO"
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Dimensions / Size / Weight</label>
              <input type="text" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder='e.g., 3" x 4", 8 oz'
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Price ($)</label>
              <input type="text" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g., 24.99"
                className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#aaa' }}>Additional Keywords</label>
            <input type="text" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g., gift for mom, aromatherapy, stress relief"
              className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: '#aaa' }}>Platforms</label>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: platforms.includes(p.id) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: platforms.includes(p.id) ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: platforms.includes(p.id) ? '#a78bfa' : '#888', cursor: 'pointer'
                  }}>
                  <span>{p.icon}</span> {p.label}
                  {platforms.includes(p.id) && <span style={{ color: '#6366f1' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-lg text-white"
            style={{ background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="spinner" /> Generating optimized listings...
              </span>
            ) : `Generate for ${platforms.length} Platform${platforms.length !== 1 ? 's' : ''}`}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: '#555' }}>First generation is free. No account required.</p>
        </div>

        {/* Auth gate */}
        {showAuth && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <h3 className="font-semibold text-lg mb-2" style={{ color: '#f0f0f5' }}>Create a free account to continue</h3>
            <p className="text-sm mb-4" style={{ color: '#aaa' }}>You have used your free generation. Sign up to get more and save your history.</p>
            {authSent ? (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}>Check your email for a sign-in link!</div>
            ) : (
              <div className="flex gap-3">
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="your@email.com"
                  className="flex-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f0f5', borderRadius: 8, padding: '10px 14px' }} />
                <button onClick={handleSendMagicLink} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Get started free
                </button>
              </div>
            )}
            <div className="mt-3 text-center">
              <Link href="/pricing" style={{ color: '#6366f1', fontSize: 14 }}>View plans — from $49/mo →</Link>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {platforms.map(pid => {
                const p = PLATFORMS.find(x => x.id === pid)!
                return (
                  <button key={pid} onClick={() => setActiveTab(pid)}
                    className="px-5 py-3 text-sm font-medium whitespace-nowrap"
                    style={{ borderBottom: activeTab === pid ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === pid ? '#a78bfa' : '#666', background: 'transparent', cursor: 'pointer' }}>
                    {p.icon} {p.label}
                  </button>
                )
              })}
              {seoKeywords && (
                <button onClick={() => setActiveTab('seo')}
                  className="px-5 py-3 text-sm font-medium whitespace-nowrap"
                  style={{ borderBottom: activeTab === 'seo' ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === 'seo' ? '#a78bfa' : '#666', background: 'transparent', cursor: 'pointer' }}>
                  🔍 SEO
                </button>
              )}
            </div>

            <div className="p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {activeTab === 'amazon' && amazonData && (
                <div className="space-y-5">
                  <FieldBlock label="Title" value={amazonData.title as string} maxChars={200} onCopy={handleCopy} copied={copiedField} fieldId="amazon-title" />
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#aaa' }}>Bullet Points (5)</p>
                    {(amazonData.bullets as string[]).map((b, i) => (
                      <FieldBlock key={i} label={`Bullet ${i + 1}`} value={b} maxChars={150} onCopy={handleCopy} copied={copiedField} fieldId={`amazon-bullet-${i}`} small />
                    ))}
                  </div>
                  <FieldBlock label="Backend Keywords" value={amazonData.backend_keywords as string} maxBytes={249} onCopy={handleCopy} copied={copiedField} fieldId="amazon-keywords" />
                  <FieldBlock label="Description" value={amazonData.description as string} maxChars={2000} onCopy={handleCopy} copied={copiedField} fieldId="amazon-desc" multiline />
                </div>
              )}
              {activeTab === 'etsy' && etsyData && (
                <div className="space-y-5">
                  <FieldBlock label="Title" value={etsyData.title as string} maxChars={140} onCopy={handleCopy} copied={copiedField} fieldId="etsy-title" note="First 40 chars critical" />
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#aaa' }}>Tags (13 required)</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(etsyData.tags as string[]).map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-sm cursor-pointer"
                          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa' }}
                          onClick={() => handleCopy(tag, `etsy-tag-${i}`)}>
                          {copiedField === `etsy-tag-${i}` ? '✓' : tag}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => handleCopy((etsyData.tags as string[]).join(', '), 'etsy-tags-all')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      {copiedField === 'etsy-tags-all' ? '✓ Copied all tags' : 'Copy all tags'}
                    </button>
                  </div>
                  <FieldBlock label="Description" value={etsyData.description as string} maxChars={3000} onCopy={handleCopy} copied={copiedField} fieldId="etsy-desc" multiline />
                </div>
              )}
              {activeTab === 'shopify' && shopifyData && (
                <div className="space-y-5">
                  <FieldBlock label="SEO Title" value={shopifyData.title as string} minChars={50} maxChars={60} onCopy={handleCopy} copied={copiedField} fieldId="shopify-title" note="50-60 chars for Google" />
                  <FieldBlock label="Meta Description" value={shopifyData.meta_description as string} minChars={150} maxChars={160} onCopy={handleCopy} copied={copiedField} fieldId="shopify-meta" note="150-160 chars" />
                  <FieldBlock label="Product Description" value={shopifyData.description as string} maxChars={5000} onCopy={handleCopy} copied={copiedField} fieldId="shopify-desc" multiline />
                </div>
              )}
              {activeTab === 'ebay' && ebayData && (
                <div className="space-y-5">
                  <FieldBlock label="Title" value={ebayData.title as string} exactChars={80} onCopy={handleCopy} copied={copiedField} fieldId="ebay-title" note="Exactly 80 characters" />
                  <FieldBlock label="Description" value={ebayData.description as string} maxChars={4000} onCopy={handleCopy} copied={copiedField} fieldId="ebay-desc" multiline />
                </div>
              )}
              {activeTab === 'seo' && seoKeywords && (
                <div>
                  <p className="text-sm mb-3" style={{ color: '#aaa' }}>High-value keywords across all platforms:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {seoKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-sm cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc' }}
                        onClick={() => handleCopy(kw, `seo-${i}`)}>
                        {copiedField === `seo-${i}` ? '✓' : kw}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => handleCopy(seoKeywords.join(', '), 'seo-all')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                    {copiedField === 'seo-all' ? '✓ Copied all' : 'Copy all keywords'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 text-center text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.04)' }}>
              <span style={{ color: '#666' }}>Want to save this? </span>
              <button onClick={() => setShowAuth(true)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Create a free account →</button>
            </div>
          </div>
        )}
      </div>

      {/* Platform rules section */}
      <section className="py-16" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: '#f0f0f5' }}>Platform rules are hard. We handle them.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { platform: 'Amazon', icon: '🛒', rules: ['Title ≤200 chars', 'Exactly 5 bullets ≤150 chars each', 'Backend keywords ≤249 bytes', 'Rich description'] },
              { platform: 'Etsy', icon: '🎨', rules: ['Title ≤140 chars (first 40 critical)', 'Exactly 13 tags ≤20 chars each', 'Long-tail keyword focus', 'Story-driven description'] },
              { platform: 'Shopify', icon: '🏪', rules: ['SEO title 50-60 chars exactly', 'Meta description 150-160 chars', 'HTML description with headings', 'Conversion-optimized copy'] },
              { platform: 'eBay', icon: '🔵', rules: ['Title exactly 80 chars', 'Condition and specs prominent', 'Shipping and returns covered', 'Search-optimized format'] }
            ].map(item => (
              <div key={item.platform} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="font-semibold mb-3" style={{ color: '#f0f0f5' }}>{item.icon} {item.platform}</h3>
                <ul className="space-y-1">
                  {item.rules.map((r, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#888' }}>
                      <span style={{ color: '#6366f1', flexShrink: 0 }}>✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#f0f0f5' }}>Ready to stop leaving clicks on the table?</h2>
          <p className="mb-8" style={{ color: '#888' }}>Start free. Upgrade when you need more generations.</p>
          <Link href="/pricing" className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            See Pricing →
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#444' }}>
        <p>© 2026 ListingAI by Studio Zero HQ · <Link href="/pricing" style={{ color: '#555' }}>Pricing</Link> · <Link href="/dashboard" style={{ color: '#555' }}>Dashboard</Link></p>
      </footer>
    </main>
  )
}

function FieldBlock({ label, value, maxChars, minChars, maxBytes, exactChars, note, multiline, small, onCopy, copied, fieldId }: {
  label: string; value: string; maxChars?: number; minChars?: number; maxBytes?: number; exactChars?: number
  note?: string; multiline?: boolean; small?: boolean
  onCopy: (text: string, id: string) => void; copied: string | null; fieldId: string
}) {
  const charCount = value?.length || 0
  const byteCount = maxBytes ? new Blob([value || '']).size : null
  const isOver = maxChars ? charCount > maxChars : maxBytes ? (byteCount || 0) > maxBytes : false
  const isUnder = minChars ? charCount < minChars : exactChars ? charCount !== exactChars : false
  const displayCount = maxBytes ? `${byteCount}/${maxBytes}B` : exactChars ? `${charCount}/80` : maxChars ? `${charCount}/${maxChars}` : `${charCount}`

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium" style={{ color: '#aaa', fontSize: small ? 12 : undefined }}>
          {label}{note && <span className="ml-2 text-xs" style={{ color: '#555' }}>({note})</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: isOver || isUnder ? '#f87171' : '#555' }}>{displayCount}</span>
          <button onClick={() => onCopy(value, fieldId)} style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
            {copied === fieldId ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
      {multiline ? (
        <div className="p-3 rounded-lg text-sm whitespace-pre-wrap"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isOver ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`, color: '#e0e0e0', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
          {value}
        </div>
      ) : (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isOver || isUnder ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`, color: '#e0e0e0', fontSize: small ? 12 : undefined }}>
          {value}
        </div>
      )}
    </div>
  )
}
