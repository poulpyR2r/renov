# Exemples d'intégration Stripe dans les pages existantes

## 1. Page Subscription (`app/agency/subscription/page.tsx`)

### Modifier le bouton "Choisir ce plan"

Remplacez le bouton actuel par :

```typescript
const handleSubscribe = async (planId: "starter" | "pro" | "enterprise") => {
  try {
    setIsLoading(true);
    const res = await fetch("/api/stripe/subscription/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan: planId }),
    });

    const data = await res.json();

    if (data.success && data.checkoutUrl) {
      // Rediriger vers Stripe Checkout
      window.location.href = data.checkoutUrl;
    } else {
      toast.error(data.error || "Erreur lors de la création de la session");
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    toast.error("Erreur lors de la création de la session");
  } finally {
    setIsLoading(false);
  }
};

// Dans le JSX, remplacer le Button par :
<Button
  variant={isCurrentPlan ? "outline" : "default"}
  className={`w-full ${
    isCurrentPlan
      ? "border-primary"
      : plan.popular
      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
      : ""
  }`}
  disabled={isCurrentPlan || isLoading}
  onClick={() => handleSubscribe(plan.id as "starter" | "pro" | "enterprise")}
>
  {isLoading ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : isCurrentPlan ? (
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
```

### Ajouter un bouton "Gérer mon abonnement" (Customer Portal)

Ajoutez ce bouton si l'agence a un abonnement actif :

```typescript
const handleManageSubscription = async () => {
  try {
    setIsLoading(true);
    const res = await fetch("/api/stripe/customer-portal", {
      method: "POST",
    });

    const data = await res.json();

    if (data.success && data.portalUrl) {
      window.location.href = data.portalUrl;
    } else {
      toast.error(data.error || "Erreur lors de l'ouverture du Customer Portal");
    }
  } catch (error) {
    console.error("Error opening customer portal:", error);
    toast.error("Erreur lors de l'ouverture du Customer Portal");
  } finally {
    setIsLoading(false);
  }
};

// Dans le JSX, ajouter après la section des plans :
{data.subscription.plan !== "free" && data.subscription.autoRenew && (
  <Card className="mt-8">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Gérer mon abonnement</h3>
          <p className="text-sm text-muted-foreground">
            Mettez à jour votre méthode de paiement, changez de plan ou annulez votre abonnement
          </p>
        </div>
        <Button onClick={handleManageSubscription} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Gérer mon abonnement"
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

## 2. Page CPC (`app/agency/cpc/page.tsx` - à créer si elle n'existe pas)

Exemple de page pour recharger le budget CPC :

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CPC_PACKS = [
  { id: "pack50", label: "Pack 50€", amount: 50 },
  { id: "pack100", label: "Pack 100€", amount: 100 },
  { id: "pack200", label: "Pack 200€", amount: 200 },
  { id: "pack500", label: "Pack 500€", amount: 500 },
];

export default function AgencyCpcPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  const handleRecharge = async (packId: string) => {
    try {
      setIsLoading(true);
      setSelectedPack(packId);

      const res = await fetch("/api/stripe/cpc/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pack: packId }),
      });

      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Erreur lors de la création de la session de paiement");
    } finally {
      setIsLoading(false);
      setSelectedPack(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Recharger mon budget CPC</h2>
        <p className="text-muted-foreground">
          Ajoutez des crédits à votre budget pour promouvoir vos annonces
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packs disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CPC_PACKS.map((pack) => (
              <Button
                key={pack.id}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => handleRecharge(pack.id)}
                disabled={isLoading}
              >
                {isLoading && selectedPack === pack.id ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl font-bold">{pack.amount}€</span>
                    <span className="text-sm text-muted-foreground">{pack.label}</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 3. Variables d'environnement à ajouter

Ajoutez dans votre `.env.local` :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... # Récupéré depuis Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Récupéré depuis Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Récupéré depuis Stripe Dashboard ou Stripe CLI

# Price IDs (remplacez par vos vrais Price IDs)
STRIPE_PRICE_ID_STARTER=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxx
STRIPE_PRICE_ID_CPC_50=price_xxx
STRIPE_PRICE_ID_CPC_100=price_xxx
STRIPE_PRICE_ID_CPC_200=price_xxx
STRIPE_PRICE_ID_CPC_500=price_xxx

# URL de base
NEXT_PUBLIC_APP_URL=http://localhost:3000 # ou https://votre-domaine.com en production
```

## 4. Import des dépendances nécessaires

Dans les pages où vous utilisez les fonctions Stripe, ajoutez :

```typescript
import { toast } from "sonner"; // Si vous utilisez Sonner pour les toasts
import { Loader2 } from "lucide-react"; // Pour les spinners
```
