"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getConsent, saveConsent, CookieConsent } from "@/lib/cookie-consent";
import { CheckCircle2, Info } from "lucide-react";

interface CookiePreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface CookieCategory {
  id: keyof CookieConsent;
  name: string;
  description: string;
  required?: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    name: "Cookies strictement nécessaires",
    description:
      "Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils sont généralement définis en réponse à des actions que vous effectuez et qui constituent une demande de services (connexion, préférences, etc.).",
    required: true,
  },
  {
    id: "analytics",
    name: "Cookies de mesure d'audience",
    description:
      "Ces cookies nous permettent de compter les visites et les sources de trafic afin d'améliorer les performances de notre site. Ils nous aident à savoir quelles pages sont les plus et le moins populaires.",
  },
  {
    id: "marketing",
    name: "Cookies marketing / publicitaires",
    description:
      "Ces cookies peuvent être définis par nos partenaires publicitaires sur notre site. Ils peuvent être utilisés pour établir un profil de vos intérêts et vous montrer des contenus pertinents sur d'autres sites.",
  },
];

export function CookiePreferences({
  open,
  onOpenChange,
  onSaved,
}: CookiePreferencesProps) {
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: "1.0",
  });

  useEffect(() => {
    if (open) {
      // Charger les préférences existantes ou utiliser les valeurs par défaut
      const existing = getConsent();
      if (existing) {
        setPreferences({
          necessary: true,
          analytics: existing.analytics || false,
          marketing: existing.marketing || false,
          timestamp: existing.timestamp,
          version: existing.version,
        });
      } else {
        setPreferences({
          necessary: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
          version: "1.0",
        });
      }
    }
  }, [open]);

  const handleToggle = (categoryId: keyof CookieConsent) => {
    if (categoryId === "necessary") {
      return; // Ne pas permettre de désactiver les cookies nécessaires
    }

    setPreferences((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSave = () => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
    onSaved?.();
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    setPreferences((prev) => ({
      ...prev,
      necessary: true,
      analytics: true,
      marketing: true,
    }));
  };

  const handleRejectAll = () => {
    setPreferences((prev) => ({
      ...prev,
      necessary: true,
      analytics: false,
      marketing: false,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des cookies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Nous utilisons des cookies pour améliorer votre expérience sur notre site. Vous pouvez
            choisir quels cookies vous souhaitez activer. Pour en savoir plus, consultez notre{" "}
            <Link
              href="/legal/politique-cookies"
              className="text-primary hover:underline"
              target="_blank"
            >
              Politique de Cookies
            </Link>
            .
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRejectAll}>
              Tout refuser
            </Button>
            <Button variant="outline" size="sm" onClick={handleAcceptAll}>
              Tout accepter
            </Button>
          </div>

          <Separator />

          <div className="space-y-6">
            {COOKIE_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`cookie-${category.id}`}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {category.name}
                      </Label>
                      {category.required && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          Requis
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {category.required ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="hidden sm:inline">Toujours actif</span>
                      </div>
                    ) : (
                      <Switch
                        id={`cookie-${category.id}`}
                        checked={preferences[category.id] as boolean}
                        onCheckedChange={() => handleToggle(category.id)}
                      />
                    )}
                  </div>
                </div>
                {category.id !== COOKIE_CATEGORIES[COOKIE_CATEGORIES.length - 1].id && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-4 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">À propos du stockage de vos préférences</p>
              <p className="text-muted-foreground">
                Vos préférences de cookies sont enregistrées localement sur votre appareil et
                restent valides pendant 6 mois. Vous pourrez les modifier à tout moment via le
                lien "Gestion des cookies" dans le footer du site.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>Enregistrer mes choix</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
