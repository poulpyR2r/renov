"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";

export default function AgencyBillingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Facturation</h2>
        <p className="text-muted-foreground">
          Consultez et téléchargez vos factures d'abonnement et de publicité
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gestion des factures</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Cette fonctionnalité sera bientôt disponible. Vous pourrez
              consulter l'historique de vos factures, télécharger vos documents
              et gérer vos moyens de paiement.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="px-4 py-2 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Historique des factures
              </div>
              <div className="px-4 py-2 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Téléchargement PDF
              </div>
              <div className="px-4 py-2 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Moyens de paiement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
