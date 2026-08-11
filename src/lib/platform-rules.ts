export const PLATFORM_RULES = {
  amazon: {
    title: { maxChars: 200 },
    bullets: { count: 5, maxCharsEach: 150 },
    description: { maxChars: 2000 },
    backendKeywords: { maxBytes: 249 },
    searchTerms: { maxChars: 249 }
  },
  etsy: {
    title: { maxChars: 140, criticalFirstChars: 40 },
    tags: { count: 13, maxCharsEach: 20 },
    description: { maxChars: 3000 }
  },
  shopify: {
    title: { minChars: 50, maxChars: 60 },
    metaDescription: { minChars: 150, maxChars: 160 },
    description: { maxChars: 5000 }
  },
  ebay: {
    title: { exactChars: 80 },
    description: { maxChars: 4000 },
    conditionNote: { maxChars: 1000 }
  }
} as const

export type Platform = keyof typeof PLATFORM_RULES

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    credits: 50,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_1U3KvxK3jIV2QCJnh6vZDsn9'
  },
  growth: {
    name: 'Growth',
    price: 99,
    credits: 200,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_1U3KvyK3jIV2QCJnrIXvcNGo'
  },
  scale: {
    name: 'Scale',
    price: 149,
    credits: -1, // unlimited
    priceId: process.env.STRIPE_SCALE_PRICE_ID || 'price_1U3KvzK3jIV2QCJnnF6R4SFx'
  }
} as const
