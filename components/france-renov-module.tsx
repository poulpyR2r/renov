"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface FranceRenovModuleProps {
  postalCode?: string;
  propertyType?: string;
  renovationLevel?: number;
  surface?: number;
}

export function FranceRenovModule({
  postalCode,
  propertyType,
  renovationLevel,
  surface,
}: FranceRenovModuleProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Construire l'URL d'intégration France Rénov'
  // Documentation: https://mesaides.france-renov.gouv.fr/integration
  const buildFranceRenovUrl = () => {
    const baseUrl = "https://mesaides.france-renov.gouv.fr/";
    const params = new URLSearchParams();

    if (postalCode) {
      params.append("codePostal", postalCode);
    }

    // Type de logement: maison ou appartement
    if (propertyType === "house") {
      params.append("typeLogement", "maison");
    } else if (propertyType === "apartment" || propertyType === "building") {
      params.append("typeLogement", "appartement");
    }

    // Surface (si disponible)
    if (surface) {
      params.append("surface", surface.toString());
    }

    // Note: Les paramètres supplémentaires (comme etatLogement basé sur renovationLevel)
    // peuvent ne pas être supportés par l'API d'intégration officielle.
    // On les omet pour rester compatible avec l'API.

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const franceRenovUrl = buildFranceRenovUrl();
  const fallbackUrl = "https://mesaides.france-renov.gouv.fr";

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          Aides à la rénovation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mention du service public */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-primary/20">
          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Service public proposé par{" "}
            <strong className="text-foreground">France Rénov'</strong> –
            Ministère de la Transition écologique.
          </p>
        </div>

        {/* Iframe ou fallback */}
        {!iframeError ? (
          <div className="relative w-full" style={{ minHeight: "600px" }}>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Chargement du simulateur France Rénov'...
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={franceRenovUrl}
              className="w-full rounded-lg border"
              style={{
                minHeight: "600px",
                display: iframeLoaded ? "block" : "none",
              }}
              title="Simulateur d'aides à la rénovation - France Rénov'"
              allow="clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setIframeLoaded(true)}
              onError={() => {
                setIframeError(true);
                setIframeLoaded(false);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm text-destructive">
                Le simulateur France Rénov' n'a pas pu être chargé.
              </p>
            </div>
            <Button asChild size="lg" className="w-full" variant="default">
              <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Estimer mes aides à la rénovation
              </a>
            </Button>
          </div>
        )}

        {/* Lien vers le site officiel */}
        <div className="pt-2 border-t">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
            >
              En savoir plus sur France Rénov'
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
