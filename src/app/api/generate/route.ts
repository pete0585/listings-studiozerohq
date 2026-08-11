import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter specializing in optimized product listings. You generate platform-specific listings that maximize visibility and conversions.

CRITICAL PLATFORM RULES — NEVER violate these:

AMAZON:
- Title: NEVER exceed 200 characters. Include brand, product name, key features, size/quantity, color.
- Bullet points: ALWAYS write exactly 5 bullets. NEVER exceed 150 characters each. Start each with a capitalized feature keyword.
- Backend keywords: NEVER exceed 249 bytes. No punctuation, no repeated words, no brand name.
- Description: Rich HTML allowed. 2000 char max.

ETSY:
- Title: NEVER exceed 140 characters. The FIRST 40 characters are critical — your most important keywords MUST appear there (they show in search results).
- Tags: ALWAYS provide exactly 13 tags. NEVER exceed 20 characters per tag. Use long-tail keyword phrases, not single words.
- Description: Lead with benefits, story, materials. 3000 char max.

SHOPIFY:
- Title: ALWAYS 50-60 characters. This is the SEO title displayed in Google. Make it compelling and keyword-rich.
- Meta description: ALWAYS 150-160 characters. This appears in Google search results. Compelling, includes CTA.
- Description: Benefit-led, scannable with headers. 5000 char max.

EBAY:
- Title: ALWAYS use EXACTLY 80 characters — not 79, not 81. Use every single character. Include condition, brand, model, key specs, and item number/variant if needed to fill space.
- Description: Condition, specs, shipping, returns. 4000 char max.

ALWAYS return valid JSON matching the requested structure exactly. No markdown code blocks in the JSON response.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, category, keyFeatures, targetAudience, materials, dimensions, price, keywords, platforms, sessionId } = body

    if (!productName || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Product name and at least one platform required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServiceClient()

    // Check auth status
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    // For anonymous users, check session limit (1 free per session)
    if (!userId && sessionId) {
      const { count } = await supabase
        .from('listing_generations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .is('user_id', null)

      if ((count || 0) >= 1) {
        return NextResponse.json({
          error: 'free_limit_reached',
          message: 'Sign up for free to save listings and generate more.'
        }, { status: 402 })
      }
    }

    // Check subscription credits for logged-in users
    if (userId) {
      const { data: sub } = await supabase
        .from('listing_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (sub && sub.credits_limit !== -1 && sub.credits_used >= sub.credits_limit) {
        return NextResponse.json({
          error: 'credits_exhausted',
          message: 'You have used all your credits for this period. Upgrade your plan to continue.'
        }, { status: 402 })
      }
    }

    // Build platform-specific instructions
    const platformRequests = platforms.map((p: string) => {
      switch (p) {
        case 'amazon':
          return 'Generate Amazon listing with: title (max 200 chars), bullets (exactly 5, max 150 chars each), description (max 2000 chars), backend_keywords (max 249 bytes, space-separated).'
        case 'etsy':
          return 'Generate Etsy listing with: title (max 140 chars, most important keywords in first 40 chars), tags (exactly 13 tags, max 20 chars each), description (max 3000 chars).'
        case 'shopify':
          return 'Generate Shopify listing with: title (exactly 50-60 chars for SEO), meta_description (exactly 150-160 chars for Google), description (max 5000 chars, use HTML headings).'
        case 'ebay':
          return 'Generate eBay listing with: title (EXACTLY 80 characters — count them carefully and pad if needed), description (max 4000 chars).'
        default:
          return ''
      }
    }).filter(Boolean).join('\n')

    const userPrompt = `Create optimized listings for the following product:

Product Name: ${productName}
Category: ${category || 'General'}
Key Features: ${keyFeatures || 'Not specified'}
Target Audience: ${targetAudience || 'General consumers'}
Materials/Ingredients: ${materials || 'Not specified'}
Dimensions/Size: ${dimensions || 'Not specified'}
Price Point: ${price ? `$${price}` : 'Not specified'}
Additional Keywords: ${keywords || 'None'}

Requested platforms:
${platformRequests}

Return a JSON object with a key for each requested platform (${platforms.join(', ')}), containing the fields described above. Also include a "seo_keywords" array of 10-15 high-value keywords applicable across platforms.

JSON format:
{
  ${platforms.includes('amazon') ? '"amazon": { "title": "...", "bullets": ["...", "...", "...", "...", "..."], "description": "...", "backend_keywords": "..." },' : ''}
  ${platforms.includes('etsy') ? '"etsy": { "title": "...", "tags": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "description": "..." },' : ''}
  ${platforms.includes('shopify') ? '"shopify": { "title": "...", "meta_description": "...", "description": "..." },' : ''}
  ${platforms.includes('ebay') ? '"ebay": { "title": "...", "description": "..." },' : ''}
  "seo_keywords": ["...", "...", "..."]
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the JSON response
    let outputData: Record<string, unknown>
    try {
      // Strip any markdown code blocks if present
      const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      outputData = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse listing output as JSON')
    }

    // Save to database
    const inputData = { productName, category, keyFeatures, targetAudience, materials, dimensions, price, keywords }
    const record = {
      user_id: userId,
      session_id: sessionId || null,
      product_name: productName,
      input_data: inputData,
      platforms,
      output_data: outputData
    }

    const { data: savedRecord, error: saveError } = await supabase
      .from('listing_generations')
      .insert(record)
      .select('id')
      .single()

    if (saveError) {
      console.error('Failed to save generation:', saveError)
    }

    // Increment credits for subscribed users
    if (userId) {
      await supabase.rpc('increment_credits', { p_user_id: userId })
    }

    return NextResponse.json({
      success: true,
      generationId: savedRecord?.id,
      output: outputData,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    })

  } catch (error: unknown) {
    console.error('Generate error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
