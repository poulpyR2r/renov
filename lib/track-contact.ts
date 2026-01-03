/**
 * Client-side contact tracking utility
 * Appelle l'API /api/contacts/track pour enregistrer les contacts
 */

export type ContactType = 
  | "message"           // Message envoyé via messagerie
  | "form_submission"   // Formulaire de contact soumis
  | "phone_click"       // Clic sur numéro de téléphone
  | "email_click"       // Clic sur email
  | "whatsapp_click"    // Clic sur WhatsApp
  | "external_link";    // Clic sur lien de contact externe

// Session ID unique pour la déduplication
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  return sessionId;
}

/**
 * Enregistrer un contact côté client
 * @param listingId - ID de l'annonce
 * @param type - Type de contact (phone_click, email_click, etc.)
 * @returns Promise<boolean> - true si enregistré, false si doublon ou erreur
 */
export async function trackContact(
  listingId: string,
  type: ContactType
): Promise<boolean> {
  try {
    const response = await fetch("/api/contacts/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId,
        type,
        sessionId: getSessionId(),
      }),
    });

    if (!response.ok) {
      console.warn("Contact tracking failed:", response.status);
      return false;
    }

    const data = await response.json();
    return data.recorded === true;
  } catch (error) {
    console.warn("Contact tracking error:", error);
    return false;
  }
}

/**
 * Wrapper pour les liens de contact (téléphone, email)
 * Enregistre le contact avant de naviguer
 */
export function createContactHandler(
  listingId: string,
  type: ContactType,
  href: string
): () => void {
  return () => {
    // Tracker en arrière-plan (ne pas bloquer la navigation)
    trackContact(listingId, type);
    
    // Naviguer vers le lien
    window.location.href = href;
  };
}
