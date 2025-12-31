"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CookiePreferences } from "./cookie-preferences";
import Link from "next/link";
import { X } from "lucide-react";
import { hasValidConsent, saveConsent } from "@/lib/cookie-consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    // Afficher le bandeau seulement si aucun consentement valide n'existe
    if (!hasValidConsent()) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setIsVisible(false);
  };

  const handleCustomize = () => {
    setIsPreferencesOpen(true);
  };

  const handlePreferencesSaved = () => {
    setIsVisible(false);
    setIsPreferencesOpen(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" />

      {/* Bandeau */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Nous utilisons des cookies pour assurer le bon fonctionnement du site, mesurer
                l'audience et proposer des contenus adaptés. Vous pouvez{" "}
                <Link
                  href="/legal/politique-cookies"
                  className="text-primary hover:underline font-medium"
                  target="_blank"
                >
                  en savoir plus
                </Link>{" "}
                ou{" "}
                <button
                  onClick={handleCustomize}
                  className="text-primary hover:underline font-medium"
                >
                  personnaliser vos choix
                </button>
                .
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="whitespace-nowrap"
              >
                Tout refuser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomize}
                className="whitespace-nowrap"
              >
                Personnaliser
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="whitespace-nowrap"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de personnalisation */}
      <CookiePreferences
        open={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
        onSaved={handlePreferencesSaved}
      />
    </>
  );
}
