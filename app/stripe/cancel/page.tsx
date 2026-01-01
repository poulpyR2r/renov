"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function StripeCancelPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "cpc" ou "subscription"

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
          <XCircle className="w-16 h-16 mx-auto text-amber-500" />
          <CardTitle className="text-2xl mt-4">
            Paiement annulé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {type === "cpc"
              ? "Le paiement a été annulé. Vos crédits CPC n'ont pas été débités. Vous pouvez réessayer à tout moment."
              : "L'abonnement a été annulé. Aucun paiement n'a été effectué. Vous pouvez réessayer quand vous le souhaitez."}
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href={redirectUrl}>
                {type === "cpc"
                  ? "Réessayer le paiement"
                  : "Réessayer l'abonnement"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/agency">Retour au tableau de bord</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
