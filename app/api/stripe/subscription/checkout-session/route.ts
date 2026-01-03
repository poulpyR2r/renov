import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { stripe } from "@/lib/stripe-config";
import Stripe from "stripe";
import { PackType, getPackConfig, getEffectivePrice } from "@/lib/packs";

// Mapping des packs vers les Stripe Price IDs
// Ces IDs doivent être configurés dans Stripe Dashboard
function getStripePriceIdForPack(pack: PackType): string {
  const priceIds: Record<PackType, string> = {
    FREE: "", // Pas de prix pour le pack gratuit
    STARTER: process.env.STRIPE_PRICE_ID_STARTER || "price_starter",
    PRO: process.env.STRIPE_PRICE_ID_PRO || "price_pro",
    PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM || "price_premium",
  };
  return priceIds[pack];
}

export async function POST(request: NextRequest) {
  try {
    // Auth requise (AGENCY_ADMIN ou AGENCY_MANAGER)
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { pack } = body; // "STARTER", "PRO", "PREMIUM"

    // Valider le pack
    const validPacks: PackType[] = ["STARTER", "PRO", "PREMIUM"];
    if (!pack || !validPacks.includes(pack)) {
      return NextResponse.json(
        { error: "Pack invalide. Choisissez parmi: STARTER, PRO, PREMIUM" },
        { status: 400 }
      );
    }

    // Vérifier que ce n'est pas un downgrade
    const currentPack = agency.subscription?.pack || "FREE";
    const currentPriority = getPackConfig(currentPack as PackType).displayPriority;
    const targetPriority = getPackConfig(pack).displayPriority;

    if (targetPriority <= currentPriority && currentPack !== "FREE") {
      return NextResponse.json(
        { error: "Impossible de changer vers un pack inférieur. Contactez le support." },
        { status: 400 }
      );
    }

    const priceId = getStripePriceIdForPack(pack);

    // Créer ou récupérer le Stripe Customer
    const customerId = await getOrCreateStripeCustomer(
      authResult.agencyId,
      agency.email,
      agency.companyName
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Si l'agence a déjà un abonnement, on devrait utiliser le Customer Portal pour changer de plan
    // Mais ici, on permet aussi la création d'une nouvelle session (Stripe gérera le changement)
    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        agencyId: authResult.agencyId,
        pack: pack,
      },
    };

    // Créer la Checkout Session (mode=subscription pour abonnement récurrent)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${baseUrl}/stripe/cancel?type=subscription`,
      subscription_data: subscriptionData,
      metadata: {
        agencyId: authResult.agencyId,
        type: "subscription",
        pack: pack,
      },
      // Permettre la mise à jour de l'abonnement si un abonnement existe déjà
      // Stripe gérera automatiquement le changement de plan
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating subscription checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de la session d'abonnement" },
      { status: 500 }
    );
  }
}
