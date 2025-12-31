"use client";

import { useEffect, useState } from "react";
import {
  getConsent,
  hasConsentFor,
  hasValidConsent,
  CookieConsent,
} from "@/lib/cookie-consent";

/**
 * Hook pour vérifier le consentement aux cookies
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasValidConsent()) {
      setConsent(getConsent());
    }
    setIsLoading(false);

    // Écouter les changements de consentement
    const handleConsentUpdate = (event: CustomEvent) => {
      setConsent(event.detail);
    };

    window.addEventListener("cookieConsentUpdated", handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener("cookieConsentUpdated", handleConsentUpdate as EventListener);
    };
  }, []);

  return {
    consent,
    isLoading,
    hasConsent: hasValidConsent(),
    hasAnalyticsConsent: hasConsentFor("analytics"),
    hasMarketingConsent: hasConsentFor("marketing"),
  };
}
