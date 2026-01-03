"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface CpcData {
  subscription: {
    pack: string;
    packName: string;
  };
  cpc: {
    balance: number;
    totalSpent: number;
    costPerClick: number;
    discount: number;
    maxDurationDays: number;
    clicksThisMonth: number;
    lastRechargeAt?: string;
  };
}

// Packs CPC disponibles (doivent correspondre aux Price IDs Stripe)
const CPC_PACKS = [
  { id: "pack20", label: "Pack 20€", amount: 20 },
  { id: "pack50", label: "Pack 50€", amount: 50 },
  { id: "pack100", label: "Pack 100€", amount: 100 },
  { id: "pack200", label: "Pack 200€", amount: 200 },
] as const;

export default function AgencyCpcPage() {
  const [data, setData] = useState<CpcData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<string>("pack20");
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    fetchCpcData();
  }, []);

  const fetchCpcData = async () => {
    try {
      const res = await fetch("/api/agency/billing");
      const result = await res.json();
      if (result.success) {
        setData({
          subscription: result.data.subscription,
          cpc: result.data.cpc,
        });
      }
    } catch (error) {
      console.error("Error fetching CPC data:", error);
    }
    setIsLoading(false);
  };

  const handleRecharge = async () => {
    setIsRecharging(true);
    try {
      const res = await fetch("/api/stripe/cpc/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: selectedPack }),
      });

      const result = await res.json();

      if (res.ok && result.success && result.checkoutUrl) {
        // Rediriger vers Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(
          result.error || "Erreur lors de la création de la session de paiement"
        );
        setIsRecharging(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Erreur lors de la création de la session de paiement");
      setIsRecharging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Erreur lors du chargement</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Budget CPC (Publicité)</h2>
        <p className="text-muted-foreground">
          Sponsorisez vos annonces pour apparaître en priorité dans les
          résultats de recherche
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Explication */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Comment fonctionne le CPC ?
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Activez le mode CPC sur vos annonces pour les mettre
                          en avant
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Vos annonces apparaissent en priorité dans les
                          résultats de recherche
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Vous ne payez que lorsqu'un utilisateur clique sur
                          votre annonce
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Le coût par clic est débité automatiquement de votre
                          budget
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Coût par clic
                  </p>
                  <p className="text-2xl font-bold">
                    {data.cpc.costPerClick.toFixed(2)}€
                  </p>
                  {data.cpc.discount > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      -{data.cpc.discount}% grâce à votre pack {data.subscription.packName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Durée max: {data.cpc.maxDurationDays} jours
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Clics ce mois
                  </p>
                  <p className="text-2xl font-bold">
                    {data.cpc.clicksThisMonth}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total dépensé
                  </p>
                  <p className="text-2xl font-bold">
                    {data.cpc.totalSpent.toFixed(2)}€
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <p className="text-sm text-muted-foreground mb-1">
                    Solde actuel
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.cpc.balance.toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>

            {/* Rechargement */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recharger votre budget</h4>
                <p className="text-sm text-muted-foreground">
                  Ajoutez des crédits à votre budget CPC pour continuer à
                  sponsoriser vos annonces
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CPC_PACKS.map((pack) => (
                  <Button
                    key={pack.id}
                    variant={selectedPack === pack.id ? "default" : "outline"}
                    className={
                      selectedPack === pack.id
                        ? "bg-orange-500 hover:bg-orange-600"
                        : ""
                    }
                    onClick={() => setSelectedPack(pack.id)}
                  >
                    {pack.label}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleRecharge}
                disabled={isRecharging}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isRecharging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirection vers le paiement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payer avec Stripe
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Paiement sécurisé via Stripe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
