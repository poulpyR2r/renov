import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Mapping des plans vers les Price IDs Stripe
// ⚠️ IMPORTANT : Remplacez ces IDs par vos vrais Price IDs depuis Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  subscription: {
    starter: process.env.STRIPE_PRICE_ID_STARTER || "price_starter", // Remplacez par votre Price ID
    pro: process.env.STRIPE_PRICE_ID_PRO || "price_pro", // Remplacez par votre Price ID
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise", // Remplacez par votre Price ID
  },
  cpc: {
    // Pack CPC (one-time payments)
    pack20: process.env.STRIPE_PRICE_ID_CPC_20 || "price_cpc_20", // Remplacez par votre Price ID
    pack50: process.env.STRIPE_PRICE_ID_CPC_50 || "price_cpc_50", // Remplacez par votre Price ID
    pack100: process.env.STRIPE_PRICE_ID_CPC_100 || "price_cpc_100", // Remplacez par votre Price ID
    pack200: process.env.STRIPE_PRICE_ID_CPC_200 || "price_cpc_200", // Remplacez par votre Price ID
  },
} as const;

// Mapping des plans vers les maxListings
export const PLAN_MAX_LISTINGS = {
  free: 5,
  starter: 20,
  pro: 50,
  enterprise: 999,
} as const;

// Helper pour obtenir le Price ID d'un plan
export function getStripePriceIdForPlan(
  plan: "starter" | "pro" | "enterprise"
): string {
  return STRIPE_PRICE_IDS.subscription[plan];
}

// Helper pour obtenir le Price ID d'un pack CPC
export function getStripePriceIdForCpcPack(
  pack: "pack20" | "pack50" | "pack100" | "pack200"
): string {
  return STRIPE_PRICE_IDS.cpc[pack];
}

// Coût CPC de base (en euros)
export const BASE_CPC_COST = 0.5;

// Réductions CPC selon le plan d'abonnement
export const CPC_DISCOUNTS = {
  free: 0, // Pas de réduction
  starter: 0, // Pas de réduction
  pro: 0.2, // -20%
  enterprise: 0.3, // -30%
} as const;

/**
 * Calcule le coût CPC réel en fonction du plan d'abonnement
 * @param plan - Plan d'abonnement de l'agence
 * @param baseCost - Coût de base (défaut: 0.5€)
 * @returns Le coût CPC avec réduction appliquée
 */
export function getCpcCostForPlan(
  plan: "free" | "starter" | "pro" | "enterprise",
  baseCost: number = BASE_CPC_COST
): number {
  const discount = CPC_DISCOUNTS[plan] || 0;
  return baseCost * (1 - discount);
}
