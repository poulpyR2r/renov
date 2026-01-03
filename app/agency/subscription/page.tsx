"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  X,
  Crown,
  Zap,
  Building2,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PACKS, PackType, getPackConfig } from "@/lib/packs";
import { getPackFeatures } from "@/lib/pack-permissions";

interface SubscriptionData {
  pack: PackType;
  startDate: string;
  stripeSubscriptionStatus?: string;
  stripeSubscriptionCurrentPeriodEnd?: string;
  activeListingsCount: number;
}

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [upgrading, setUpgrading] = useState<PackType | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/agency/billing");
      const data = await res.json();

      if (data.success) {
        setSubscription({
          pack: data.data.subscription?.pack || "FREE",
          startDate: data.data.subscription?.startDate,
          stripeSubscriptionStatus: data.data.stripeSubscriptionStatus,
          stripeSubscriptionCurrentPeriodEnd: data.data.stripeSubscriptionCurrentPeriodEnd,
          activeListingsCount: data.data.currentListings || 0,
        });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (targetPack: PackType) => {
    setUpgrading(targetPack);
    
    try {
      const res = await fetch("/api/stripe/subscription/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: targetPack }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Erreur lors de la création de la session");
      }
    } catch (error) {
      toast.error("Erreur lors de l'upgrade");
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const getPackIcon = (pack: PackType) => {
    switch (pack) {
      case "FREE":
        return <Building2 className="w-6 h-6" />;
      case "STARTER":
        return <Star className="w-6 h-6" />;
      case "PRO":
        return <Zap className="w-6 h-6" />;
      case "PREMIUM":
        return <Crown className="w-6 h-6" />;
    }
  };

  const getPackColor = (pack: PackType) => {
    switch (pack) {
      case "FREE":
        return "bg-gray-100 text-gray-700";
      case "STARTER":
        return "bg-blue-100 text-blue-700";
      case "PRO":
        return "bg-orange-100 text-orange-700";
      case "PREMIUM":
        return "bg-purple-100 text-purple-700";
    }
  };

  const isCurrentPack = (pack: PackType) => subscription?.pack === pack;
  const canUpgradeTo = (pack: PackType) => {
    if (!subscription) return false;
    const currentPriority = getPackConfig(subscription.pack).displayPriority;
    const targetPriority = getPackConfig(pack).displayPriority;
    return targetPriority > currentPriority;
  };

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
        <h2 className="text-2xl font-bold">Mon abonnement</h2>
        <p className="text-muted-foreground">
          Gérez votre pack et accédez à plus de fonctionnalités
        </p>
      </div>

      {/* Current subscription info */}
      {subscription && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getPackColor(subscription.pack)}`}>
                  {getPackIcon(subscription.pack)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Pack {getPackConfig(subscription.pack).name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription.activeListingsCount} annonces actives
                    {getPackConfig(subscription.pack).maxActiveListings !== -1 && (
                      <> / {getPackConfig(subscription.pack).maxActiveListings} max</>
                    )}
                  </p>
                </div>
              </div>
              
              {subscription.stripeSubscriptionStatus === "active" && (
                <Button variant="outline" onClick={handleManageSubscription}>
                  Gérer mon abonnement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packs grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(PACKS) as PackType[]).map((packKey) => {
          const pack = PACKS[packKey];
          const isCurrent = isCurrentPack(packKey);
          const canUpgrade = canUpgradeTo(packKey);
          const features = getPackFeatures(packKey);

          return (
            <Card
              key={packKey}
              className={`relative overflow-hidden transition-all ${
                isCurrent
                  ? "border-2 border-primary shadow-lg"
                  : "border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Actuel
                </div>
              )}

              {packKey === "PRO" && !isCurrent && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-medium px-3 py-1 text-center">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Populaire
                </div>
              )}

              <CardHeader className={packKey === "PRO" && !isCurrent ? "pt-8" : ""}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPackColor(packKey)}`}>
                    {getPackIcon(packKey)}
                  </div>
                  <CardTitle className="text-xl">{pack.name}</CardTitle>
                </div>

                <div className="mt-4">
                  {pack.price === 0 ? (
                    <div className="text-3xl font-bold">Gratuit</div>
                  ) : (
                    <div>
                      {pack.launchPrice && pack.launchPrice < pack.price && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {pack.price}€
                        </span>
                      )}
                      <span className="text-3xl font-bold">
                        {pack.launchPrice || pack.price}€
                      </span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features list */}
                <ul className="space-y-2">
                  {features.slice(0, 8).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {features.length > 8 && (
                    <li className="text-sm text-muted-foreground pl-6">
                      + {features.length - 8} autres avantages
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="secondary">
                      Pack actuel
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(packKey)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === packKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Passer au {pack.name}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      Pack inférieur
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Puis-je changer de pack à tout moment ?</h4>
            <p className="text-sm text-muted-foreground">
              Oui, vous pouvez upgrader votre pack à tout moment. Le changement prend effet immédiatement.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Que se passe-t-il si je dépasse ma limite d'annonces ?</h4>
            <p className="text-sm text-muted-foreground">
              Vos annonces existantes restent actives, mais vous ne pourrez plus en créer de nouvelles jusqu'à ce que vous passiez à un pack supérieur ou que vous désactiviez des annonces.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Comment fonctionne le CPC ?</h4>
            <p className="text-sm text-muted-foreground">
              Le CPC (Coût Par Clic) vous permet de sponsoriser vos annonces. Chaque pack offre une réduction sur le tarif et une durée maximale de sponsoring différente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
