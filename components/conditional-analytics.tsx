"use client";

import { useEffect } from "react";
import { hasConsentFor } from "@/lib/cookie-consent";

/**
 * Composant pour charger conditionnellement les scripts analytics
 * Ne charge que si l'utilisateur a consenti aux cookies analytics
 */
export function ConditionalAnalytics() {
  useEffect(() => {
    // Vérifier le consentement pour les cookies analytics
    if (hasConsentFor("analytics")) {
      // Ici, vous pouvez charger vos scripts analytics
      // Exemple avec Vercel Analytics (déjà chargé côté serveur)
      // Pour d'autres solutions (Google Analytics, etc.), charger ici

      // Note: Vercel Analytics est déjà chargé dans le layout
      // Ce composant sert d'exemple pour d'autres scripts
      // Si vous utilisez d'autres analytics, chargez-les ici
      
      // Exemple avec Google Analytics (à décommenter si nécessaire):
      /*
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
      */
    }
  }, []);

  return null;
}
