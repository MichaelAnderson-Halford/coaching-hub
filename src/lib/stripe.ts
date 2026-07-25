import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export const PRICE_IDS = {
  starter: "price_1TxBvqS0SZp5ueSfcgC9u6nx",
  growth: "price_1TxBw8S0SZp5ueSfqa0d3AQh",
  scale: "price_1TxBwRS0SZp5ueSfXJnlBMog",
} as const;

export type PlanTier = keyof typeof PRICE_IDS;
