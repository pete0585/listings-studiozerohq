import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://listings.studiozerohq.com'

    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${siteUrl}/dashboard`
      }
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: 'Magic link sent to your email' })

  } catch (error: unknown) {
    console.error('Magic link error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send magic link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
