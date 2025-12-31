"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Loader2,
  Zap,
  Euro,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface CpcData {
  cpc: {
    balance: number;
    totalSpent: number;
    costPerClick: number;
    clicksThisMonth: number;
    lastRechargeAt?: string;
  };
}

const rechargeAmounts = [20, 50, 100, 200];

export default function AgencyCpcPage() {
  const [data, setData] = useState<CpcData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    fetchCpcData();
  }, []);

  const fetchCpcData = async () => {
    try {
      const res = await fetch("/api/agency/billing");
      const result = await res.json();
      if (result.success) {
        setData({ cpc: result.data.cpc });
      }
    } catch (error) {
      console.error("Error fetching CPC data:", error);
    }
    setIsLoading(false);
  };

  const handleRecharge = async () => {
    if (rechargeAmount < 10) {
      toast.error("Montant minimum: 10€");
      return;
    }

    setIsRecharging(true);
    try {
      const res = await fetch("/api/agency/billing/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: rechargeAmount }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`${rechargeAmount}€ ajoutés à votre budget CPC`);
        fetchCpcData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors du rechargement");
    }
    setIsRecharging(false);
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
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Comment fonctionne le CPC ?
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
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
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
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

              <div className="flex flex-wrap gap-2">
                {rechargeAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={rechargeAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRechargeAmount(amount)}
                    className={
                      rechargeAmount === amount
                        ? "bg-orange-500 hover:bg-orange-600"
                        : ""
                    }
                  >
                    {amount}€
                  </Button>
                ))}
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Autre"
                    className="w-24 pl-8"
                    value={
                      rechargeAmounts.includes(rechargeAmount)
                        ? ""
                        : rechargeAmount
                    }
                    onChange={(e) =>
                      setRechargeAmount(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleRecharge}
                disabled={isRecharging || rechargeAmount < 10}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isRecharging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Recharger {rechargeAmount}€
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Mode démo - Pas de paiement réel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

