import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PLANS = {
  player_premium: {
    priceId: process.env.STRIPE_PLAYER_PREMIUM_PRICE_ID!,
    name: 'Player Premium',
    price: 9,
    features: ['Featured placement', 'View who visited your profile', 'Priority in search results', 'Direct message inbox'],
  },
  club_starter: {
    priceId: process.env.STRIPE_CLUB_STARTER_PRICE_ID!,
    name: 'Club Starter',
    price: 49,
    features: ['Search all players', 'Contact up to 10 players/month', 'Save shortlists', 'Basic filters'],
  },
  club_pro: {
    priceId: process.env.STRIPE_CLUB_PRO_PRICE_ID!,
    name: 'Club Pro',
    price: 149,
    features: ['Unlimited contacts', 'Advanced filters', 'Multiple shortlists', 'Export to CSV', 'Team access (3 users)'],
  },
}
