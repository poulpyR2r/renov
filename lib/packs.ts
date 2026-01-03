/**
 * Configuration des packs agences
 * Toutes les règles métier sont centralisées ici
 */

export type PackType = "FREE" | "STARTER" | "PRO" | "PREMIUM";

export interface PackConfig {
  id: PackType;
  name: string;
  price: number; // Prix en euros par mois
  launchPrice?: number; // Prix de lancement (optionnel)
  
  // Capacités
  maxActiveListings: number; // -1 = illimité
  
  // Visibilité / Priorité (plus haut = plus prioritaire)
  displayPriority: number;
  mapHighlight: boolean;
  autoBoost: boolean;
  autoBoostDuration?: number; // En heures
  autoBoostRecurrent?: boolean;
  
  // CPC
  cpcDiscount: number; // En pourcentage (0-100)
  cpcMaxDurationDays: number;
  
  // Statistiques visibles
  stats: {
    views: boolean;
    clicks: boolean;
    contacts: boolean;
    performancePerListing: boolean;
    costPerContact: boolean;
    globalPerformance: boolean;
    performanceByZone: boolean;
  };
  
  // Fonctionnalités
  features: {
    badge: string | null; // null = pas de badge
    prioritySupport: boolean;
    accountManager: boolean;
    cpcHelp: boolean;
    earlyAccess: boolean;
  };
}

export const PACKS: Record<PackType, PackConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    maxActiveListings: 5,
    displayPriority: 0,
    mapHighlight: false,
    autoBoost: false,
    cpcDiscount: 0,
    cpcMaxDurationDays: 3,
    stats: {
      views: true,
      clicks: true,
      contacts: false,
      performancePerListing: false,
      costPerContact: false,
      globalPerformance: false,
      performanceByZone: false,
    },
    features: {
      badge: null,
      prioritySupport: false,
      accountManager: false,
      cpcHelp: false,
      earlyAccess: false,
    },
  },
  
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 49,
    launchPrice: 39,
    maxActiveListings: 20,
    displayPriority: 1,
    mapHighlight: false,
    autoBoost: false,
    cpcDiscount: 20,
    cpcMaxDurationDays: 7,
    stats: {
      views: true,
      clicks: true,
      contacts: true,
      performancePerListing: false,
      costPerContact: false,
      globalPerformance: false,
      performanceByZone: false,
    },
    features: {
      badge: "Agence vérifiée",
      prioritySupport: false,
      accountManager: false,
      cpcHelp: false,
      earlyAccess: false,
    },
  },
  
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 99,
    maxActiveListings: 50,
    displayPriority: 2,
    mapHighlight: true,
    autoBoost: true,
    autoBoostDuration: 48,
    autoBoostRecurrent: false,
    cpcDiscount: 30,
    cpcMaxDurationDays: 14,
    stats: {
      views: true,
      clicks: true,
      contacts: true,
      performancePerListing: true,
      costPerContact: false,
      globalPerformance: false,
      performanceByZone: false,
    },
    features: {
      badge: "Agence Premium",
      prioritySupport: true,
      accountManager: false,
      cpcHelp: false,
      earlyAccess: false,
    },
  },
  
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    price: 199,
    maxActiveListings: -1, // Illimité
    displayPriority: 3,
    mapHighlight: true,
    autoBoost: true,
    autoBoostDuration: 48,
    autoBoostRecurrent: true,
    cpcDiscount: 40,
    cpcMaxDurationDays: 30,
    stats: {
      views: true,
      clicks: true,
      contacts: true,
      performancePerListing: true,
      costPerContact: true,
      globalPerformance: true,
      performanceByZone: true,
    },
    features: {
      badge: "Agence Premium",
      prioritySupport: true,
      accountManager: true,
      cpcHelp: true,
      earlyAccess: true,
    },
  },
};

/**
 * Obtenir la configuration d'un pack
 */
export function getPackConfig(pack: PackType): PackConfig {
  return PACKS[pack] || PACKS.FREE;
}

/**
 * Obtenir le prix effectif (prix lancement si disponible)
 */
export function getEffectivePrice(pack: PackType): number {
  const config = getPackConfig(pack);
  return config.launchPrice ?? config.price;
}

/**
 * Vérifier si une agence peut créer une nouvelle annonce
 */
export function canCreateListing(pack: PackType, currentActiveListings: number): boolean {
  const config = getPackConfig(pack);
  if (config.maxActiveListings === -1) return true;
  return currentActiveListings < config.maxActiveListings;
}

/**
 * Obtenir le nombre d'annonces restantes
 */
export function getRemainingListings(pack: PackType, currentActiveListings: number): number {
  const config = getPackConfig(pack);
  if (config.maxActiveListings === -1) return Infinity;
  return Math.max(0, config.maxActiveListings - currentActiveListings);
}

/**
 * Calculer le prix CPC avec réduction
 */
export function calculateCpcPrice(pack: PackType, basePrice: number): number {
  const config = getPackConfig(pack);
  const discount = config.cpcDiscount / 100;
  return basePrice * (1 - discount);
}

/**
 * Vérifier si une feature est accessible
 */
export function hasFeature(pack: PackType, feature: keyof PackConfig["features"]): boolean {
  const config = getPackConfig(pack);
  return !!config.features[feature];
}

/**
 * Vérifier si une stat est visible
 */
export function canViewStat(pack: PackType, stat: keyof PackConfig["stats"]): boolean {
  const config = getPackConfig(pack);
  return config.stats[stat];
}

/**
 * Obtenir tous les packs triés par priorité
 */
export function getPacksByPriority(): PackConfig[] {
  return Object.values(PACKS).sort((a, b) => b.displayPriority - a.displayPriority);
}

/**
 * Comparer deux packs (retourne true si pack1 > pack2)
 */
export function isPackHigherThan(pack1: PackType, pack2: PackType): boolean {
  return getPackConfig(pack1).displayPriority > getPackConfig(pack2).displayPriority;
}
