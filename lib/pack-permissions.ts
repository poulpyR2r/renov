/**
 * Service centralisé de gestion des permissions par pack
 * Toutes les vérifications de droits passent par ce service
 */

import { PackType, getPackConfig, canCreateListing, calculateCpcPrice, canViewStat, hasFeature } from "./packs";

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredPack?: PackType;
  upgradeMessage?: string;
}

export interface AgencyPackInfo {
  pack: PackType;
  activeListingsCount: number;
}

/**
 * Vérifier si une agence peut créer une nouvelle annonce
 */
export function checkCanCreateListing(agency: AgencyPackInfo): PermissionResult {
  const config = getPackConfig(agency.pack);
  const canCreate = canCreateListing(agency.pack, agency.activeListingsCount);
  
  if (canCreate) {
    return { allowed: true };
  }
  
  // Déterminer le pack requis pour plus d'annonces
  let requiredPack: PackType = "STARTER";
  if (agency.pack === "STARTER") requiredPack = "PRO";
  if (agency.pack === "PRO") requiredPack = "PREMIUM";
  
  return {
    allowed: false,
    reason: `Limite d'annonces atteinte (${config.maxActiveListings} max)`,
    requiredPack,
    upgradeMessage: `Passez au pack ${requiredPack} pour publier plus d'annonces`,
  };
}

/**
 * Vérifier si une agence peut sponsoriser une annonce
 */
export function checkCanSponsor(agency: AgencyPackInfo): PermissionResult {
  // Tous les packs peuvent sponsoriser
  return { allowed: true };
}

/**
 * Vérifier si une agence peut voir les contacts reçus
 */
export function checkCanViewContacts(agency: AgencyPackInfo): PermissionResult {
  const canView = canViewStat(agency.pack, "contacts");
  
  if (canView) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Fonctionnalité réservée aux packs payants",
    requiredPack: "STARTER",
    upgradeMessage: "Passez au pack Starter pour voir vos contacts reçus",
  };
}

/**
 * Vérifier si une agence peut voir les statistiques avancées
 */
export function checkCanViewAdvancedStats(agency: AgencyPackInfo, stat: "performancePerListing" | "costPerContact" | "globalPerformance" | "performanceByZone"): PermissionResult {
  const canView = canViewStat(agency.pack, stat);
  
  if (canView) {
    return { allowed: true };
  }
  
  let requiredPack: PackType = "PRO";
  if (stat === "costPerContact" || stat === "globalPerformance" || stat === "performanceByZone") {
    requiredPack = "PREMIUM";
  }
  
  const statLabels: Record<string, string> = {
    performancePerListing: "performance par annonce",
    costPerContact: "coût par contact",
    globalPerformance: "performance globale",
    performanceByZone: "performance par zone",
  };
  
  return {
    allowed: false,
    reason: `Statistique "${statLabels[stat]}" réservée au pack ${requiredPack}`,
    requiredPack,
    upgradeMessage: `Passez au pack ${requiredPack} pour accéder aux statistiques avancées`,
  };
}

/**
 * Vérifier si une agence a accès à la mise en avant carte
 */
export function checkCanUseMapHighlight(agency: AgencyPackInfo): PermissionResult {
  const config = getPackConfig(agency.pack);
  
  if (config.mapHighlight) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Mise en avant carte réservée aux packs Pro et Premium",
    requiredPack: "PRO",
    upgradeMessage: "Passez au pack Pro pour mettre en avant vos annonces sur la carte",
  };
}

/**
 * Vérifier si une agence a accès au boost automatique
 */
export function checkCanUseAutoBoost(agency: AgencyPackInfo): PermissionResult {
  const config = getPackConfig(agency.pack);
  
  if (config.autoBoost) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Boost automatique réservé aux packs Pro et Premium",
    requiredPack: "PRO",
    upgradeMessage: "Passez au pack Pro pour bénéficier du boost automatique",
  };
}

/**
 * Vérifier si une agence a accès au support prioritaire
 */
export function checkHasPrioritySupport(agency: AgencyPackInfo): PermissionResult {
  const hasPriority = hasFeature(agency.pack, "prioritySupport");
  
  if (hasPriority) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Support prioritaire réservé aux packs Pro et Premium",
    requiredPack: "PRO",
    upgradeMessage: "Passez au pack Pro pour bénéficier du support prioritaire",
  };
}

/**
 * Vérifier si une agence a un account manager dédié
 */
export function checkHasAccountManager(agency: AgencyPackInfo): PermissionResult {
  const hasAM = hasFeature(agency.pack, "accountManager");
  
  if (hasAM) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: "Account manager réservé au pack Premium",
    requiredPack: "PREMIUM",
    upgradeMessage: "Passez au pack Premium pour bénéficier d'un account manager dédié",
  };
}

/**
 * Obtenir les paramètres CPC pour un pack
 */
export function getCpcParams(pack: PackType, basePricePerClick: number = 0.50) {
  const config = getPackConfig(pack);
  
  return {
    pricePerClick: calculateCpcPrice(pack, basePricePerClick),
    discount: config.cpcDiscount,
    maxDurationDays: config.cpcMaxDurationDays,
  };
}

/**
 * Vérifier si une sponsorisation est active
 */
export function isSponsoringActive(
  startAt: Date | null | undefined,
  endAt: Date | null | undefined,
  remainingBudget: number
): boolean {
  if (!startAt || !endAt) return false;
  
  const now = new Date();
  return now >= startAt && now <= endAt && remainingBudget > 0;
}

/**
 * Obtenir toutes les restrictions d'un pack
 */
export function getPackRestrictions(pack: PackType): string[] {
  const config = getPackConfig(pack);
  const restrictions: string[] = [];
  
  if (config.maxActiveListings !== -1) {
    restrictions.push(`Maximum ${config.maxActiveListings} annonces actives`);
  }
  
  if (!config.mapHighlight) {
    restrictions.push("Pas de mise en avant sur la carte");
  }
  
  if (!config.autoBoost) {
    restrictions.push("Pas de boost automatique");
  }
  
  if (!config.stats.contacts) {
    restrictions.push("Contacts reçus non visibles");
  }
  
  if (!config.stats.performancePerListing) {
    restrictions.push("Statistiques par annonce non disponibles");
  }
  
  if (!config.features.prioritySupport) {
    restrictions.push("Support standard uniquement");
  }
  
  return restrictions;
}

/**
 * Obtenir toutes les fonctionnalités incluses dans un pack
 */
export function getPackFeatures(pack: PackType): string[] {
  const config = getPackConfig(pack);
  const features: string[] = [];
  
  // Annonces
  if (config.maxActiveListings === -1) {
    features.push("Annonces illimitées");
  } else {
    features.push(`Jusqu'à ${config.maxActiveListings} annonces actives`);
  }
  
  // Priorité
  if (config.displayPriority > 0) {
    const priorityLabels = ["", "Priorité légère", "Priorité élevée", "Priorité absolue"];
    features.push(priorityLabels[config.displayPriority] || "Priorité dans les résultats");
  }
  
  // Carte
  if (config.mapHighlight) {
    features.push("Mise en avant sur la carte");
  }
  
  // Boost
  if (config.autoBoost) {
    features.push(config.autoBoostRecurrent 
      ? "Boost automatique récurrent" 
      : "Boost automatique (48h, 1 fois)");
  }
  
  // CPC
  if (config.cpcDiscount > 0) {
    features.push(`-${config.cpcDiscount}% sur le CPC`);
  }
  features.push(`CPC jusqu'à ${config.cpcMaxDurationDays} jours`);
  
  // Stats
  features.push("Vues et clics");
  if (config.stats.contacts) features.push("Contacts reçus");
  if (config.stats.performancePerListing) features.push("Performance par annonce");
  if (config.stats.costPerContact) features.push("Coût par contact");
  if (config.stats.globalPerformance) features.push("Performance globale");
  if (config.stats.performanceByZone) features.push("Performance par zone");
  
  // Features
  if (config.features.badge) features.push(`Badge "${config.features.badge}"`);
  if (config.features.prioritySupport) features.push("Support prioritaire");
  if (config.features.accountManager) features.push("Account manager dédié");
  if (config.features.cpcHelp) features.push("Aide paramétrage CPC");
  if (config.features.earlyAccess) features.push("Accès anticipé aux nouvelles fonctionnalités");
  
  return features;
}
