"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CreditCard,
  Loader2,
  Check,
  ArrowRight,
  Star,
  Crown,
  Sparkles,
} from "lucide-react";

interface SubscriptionData {
  subscription: {
    plan: string;
    maxListings: number;
    startDate: string;
    endDate?: string;
    autoRenew: boolean;
  };
  currentListings: number;
}

const plans = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    maxListings: 5,
    icon: Star,
    color: "gray",
    features: ["5 annonces", "Statistiques de base", "Support email"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    maxListings: 20,
    icon: Sparkles,
    color: "blue",
    features: [
      "20 annonces",
      "Statistiques avancées",
      "Support prioritaire",
      "Badge vérifié",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    maxListings: 50,
    popular: true,
    icon: Crown,
    color: "purple",
    features: [
      "50 annonces",
      "Statistiques premium",
      "Support dédié",
      "Badge vérifié",
      "CPC -20%",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    maxListings: 999,
    icon: Crown,
    color: "amber",
    features: [
      "Annonces illimitées",
      "Statistiques premium",
      "Account manager",
      "Badge vérifié",
      "CPC -30%",
      "API access",
    ],
  },
];

export default function AgencySubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const res = await fetch("/api/agency/billing");
      const result = await res.json();
      if (result.success) {
        setData({
          subscription: result.data.subscription,
          currentListings: result.data.currentListings,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
    setIsLoading(false);
  };

  const getCurrentPlan = () => {
    return plans.find((p) => p.id === data?.subscription.plan) || plans[0];
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "free":
        return "Gratuit";
      case "starter":
        return "Starter";
      case "pro":
        return "Pro";
      case "enterprise":
        return "Enterprise";
      default:
        return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "starter":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "pro":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
      case "enterprise":
        return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
      default:
        return "bg-gray-100 text-gray-700";
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

  const currentPlan = getCurrentPlan();
  const listingsRemaining =
    data.subscription.maxListings - data.currentListings;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Votre abonnement</h2>
        <p className="text-muted-foreground">
          Gérez votre plan d'abonnement et le nombre d'annonces disponibles
        </p>
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-xl font-bold mb-2">Choisissez votre plan</h3>
        <p className="text-muted-foreground mb-6">
          Passez à un plan supérieur pour publier plus d'annonces et bénéficier
          de fonctionnalités avancées
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = data.subscription.plan === plan.id;
            const PlanIcon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={`border-0 shadow-md relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular
                    ? "ring-2 ring-orange-500 scale-[1.02]"
                    : isCurrentPlan
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    ⭐ Le plus populaire
                  </div>
                )}
                <CardContent className={`p-6 ${plan.popular ? "pt-10" : ""}`}>
                  <div className="text-center mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                        plan.color === "gray"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : plan.color === "blue"
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : plan.color === "purple"
                          ? "bg-purple-100 dark:bg-purple-900/40"
                          : "bg-gradient-to-br from-amber-400 to-orange-500"
                      }`}
                    >
                      <PlanIcon
                        className={`w-6 h-6 ${
                          plan.color === "gray"
                            ? "text-gray-600"
                            : plan.color === "blue"
                            ? "text-blue-600"
                            : plan.color === "purple"
                            ? "text-purple-600"
                            : "text-white"
                        }`}
                      />
                    </div>
                    <h4 className="font-bold text-lg">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}€</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">
                          /mois
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.maxListings === 999
                        ? "Annonces illimitées"
                        : `${plan.maxListings} annonces`}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isCurrentPlan ? "outline" : "default"}
                    className={`w-full ${
                      isCurrentPlan
                        ? "border-primary"
                        : plan.popular
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                        : ""
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Plan actuel
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Choisir ce plan
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Abonnement - Section principale */}
      {/* <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                <Star className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold">Votre abonnement actuel</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(
                      data.subscription.plan
                    )}`}
                  >
                    {getPlanLabel(data.subscription.plan)}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {data.subscription.maxListings} annonces incluses dans votre
                  plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-600">
                  {data.currentListings}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
                    / {data.subscription.maxListings}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  annonces publiées
                </p>
              </div>
              <Button variant="default" asChild>
                <Link href="/agency/subscription">Changer de plan</Link>
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full h-3 bg-white/80 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all ${
                  listingsRemaining <= 0
                    ? "bg-red-500"
                    : listingsRemaining <= 2
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-orange-400 to-amber-400"
                }`}
                style={{
                  width: `${Math.min(
                    (data.currentListings / data.subscription.maxListings) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-sm mt-2 text-muted-foreground">
              {listingsRemaining > 0 ? (
                <>
                  Il vous reste{" "}
                  <span className="font-semibold text-emerald-600">
                    {listingsRemaining} annonce(s)
                  </span>{" "}
                  à publier
                </>
              ) : (
                <span className="text-red-600 font-medium">
                  Limite atteinte - Passez au plan supérieur pour publier plus
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
