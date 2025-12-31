/**
 * Gestion du consentement aux cookies
 */

export interface CookieConsent {
  necessary: boolean; // Toujours true, non modifiable
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_STORAGE_KEY = "cookie_consent";
const CONSENT_VERSION = "1.0";
const CONSENT_VALIDITY_MONTHS = 6;

/**
 * Vérifier si un consentement valide existe
 */
export function hasValidConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return false;

    const consent: CookieConsent = JSON.parse(stored);

    // Vérifier la version
    if (consent.version !== CONSENT_VERSION) {
      return false;
    }

    // Vérifier la date d'expiration (6 mois)
    const timestamp = new Date(consent.timestamp);
    const expirationDate = new Date(timestamp);
    expirationDate.setMonth(expirationDate.getMonth() + CONSENT_VALIDITY_MONTHS);

    if (new Date() > expirationDate) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Récupérer le consentement actuel
 */
export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const consent: CookieConsent = JSON.parse(stored);

    // Vérifier la validité
    if (!hasValidConsent()) {
      return null;
    }

    return consent;
  } catch {
    return null;
  }
}

/**
 * Enregistrer le consentement
 */
export function saveConsent(consent: Omit<CookieConsent, "timestamp" | "version">): void {
  if (typeof window === "undefined") return;

  const fullConsent: CookieConsent = {
    ...consent,
    necessary: true, // Toujours true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullConsent));
    
    // Déclencher un événement personnalisé pour notifier les scripts
    window.dispatchEvent(new CustomEvent("cookieConsentUpdated", { detail: fullConsent }));
  } catch (error) {
    console.error("Error saving cookie consent:", error);
  }
}

/**
 * Vérifier si une catégorie de cookies est consentie
 */
export function hasConsentFor(category: "analytics" | "marketing"): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent[category] === true;
}

/**
 * Réinitialiser le consentement (pour les tests ou si la politique change)
 */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("cookieConsentReset"));
}
