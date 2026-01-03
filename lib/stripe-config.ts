import Stripe from "stripe";
import { PackType, getPackConfig } from "./packs";

// ============================================
// STRIPE CLIENT - Initialisation lazy
// ============================================

let stripeInstance: Stripe | null = null;

/**
 * Obtient l'instance Stripe (initialisation lazy)
 * Permet le build sans STRIPE_SECRET_KEY
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export pour compatibilité (usage direct)
// Note: Utiliser getStripe() de préférence
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Mapping des packs vers les Price IDs Stripe
// ⚠️ IMPORTANT : Remplacez ces IDs par vos vrais Price IDs depuis Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  subscription: {
    STARTER: process.env.STRIPE_PRICE_ID_STARTER || "price_starter",
    PRO: process.env.STRIPE_PRICE_ID_PRO || "price_pro",
    PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM || "price_premium",
  },
  cpc: {
    // Pack CPC (one-time payments)
    pack20: process.env.STRIPE_PRICE_ID_CPC_20 || "price_cpc_20",
    pack50: process.env.STRIPE_PRICE_ID_CPC_50 || "price_cpc_50",
    pack100: process.env.STRIPE_PRICE_ID_CPC_100 || "price_cpc_100",
    pack200: process.env.STRIPE_PRICE_ID_CPC_200 || "price_cpc_200",
  },
} as const;

// Helper pour obtenir le Price ID d'un pack
export function getStripePriceIdForPack(
  pack: "STARTER" | "PRO" | "PREMIUM"
): string {
  return STRIPE_PRICE_IDS.subscription[pack];
}

// Helper pour obtenir le Price ID d'un pack CPC
export function getStripePriceIdForCpcPack(
  pack: "pack20" | "pack50" | "pack100" | "pack200"
): string {
  return STRIPE_PRICE_IDS.cpc[pack];
}

// Coût CPC de base (en euros)
export const BASE_CPC_COST = 0.5;

/**
 * Calcule le coût CPC réel en fonction du pack d'abonnement
 * Utilise la configuration centralisée des packs
 * @param pack - Pack d'abonnement de l'agence
 * @param baseCost - Coût de base (défaut: 0.5€)
 * @returns Le coût CPC avec réduction appliquée
 */
export function getCpcCostForPack(
  pack: PackType,
  baseCost: number = BASE_CPC_COST
): number {
  const config = getPackConfig(pack);
  const discountPercent = config.cpcDiscount / 100;
  return baseCost * (1 - discountPercent);
}

/**
 * Obtient la durée max de sponsoring CPC en jours selon le pack
 * @param pack - Pack d'abonnement de l'agence
 * @returns Durée max en jours
 */
export function getCpcMaxDurationDays(pack: PackType): number {
  const config = getPackConfig(pack);
  return config.cpcMaxDurationDays;
}

// ==========================================
// COMPATIBILITÉ ANCIENNE API (DEPRECATED)
// À supprimer après migration complète
// ==========================================

// Mapping ancien format -> nouveau format
const LEGACY_PLAN_TO_PACK: Record<string, PackType> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
  enterprise: "PREMIUM",
};

/**
 * @deprecated Utilisez getCpcCostForPack à la place
 */
export function getCpcCostForPlan(
  plan: "free" | "starter" | "pro" | "enterprise" | string,
  baseCost: number = BASE_CPC_COST
): number {
  const pack = LEGACY_PLAN_TO_PACK[plan] || "FREE";
  return getCpcCostForPack(pack, baseCost);
}
