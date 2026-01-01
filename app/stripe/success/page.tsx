"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function StripeSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type"); // "cpc" ou "subscription"
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Donner un peu de temps pour que le webhook soit traité
    // En production, on pourrait vérifier le statut via une API
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const redirectUrl =
    type === "cpc"
      ? "/agency/cpc"
      : type === "subscription"
      ? "/agency/subscription"
      : "/agency";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isLoading ? (
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
          )}
          <CardTitle className="text-2xl mt-4">
            {isLoading
              ? "Traitement en cours..."
              : type === "cpc"
              ? "Paiement réussi !"
              : "Abonnement activé !"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLoading && (
            <>
              <p className="text-center text-muted-foreground">
                {type === "cpc"
                  ? "Vos crédits CPC ont été ajoutés à votre compte. Vous pouvez maintenant les utiliser pour promouvoir vos annonces."
                  : "Votre abonnement a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan."}
              </p>

              {sessionId && (
                <p className="text-xs text-muted-foreground text-center">
                  ID de session : {sessionId.substring(0, 20)}...
                </p>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild className="w-full">
                  <Link href={redirectUrl}>
                    {type === "cpc"
                      ? "Voir mon budget CPC"
                      : "Voir mon abonnement"}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/agency">Retour au tableau de bord</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
