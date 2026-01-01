import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { stripe } from "@/lib/stripe-config";
import { getStripePriceIdForPlan, PLAN_MAX_LISTINGS } from "@/lib/stripe-config";
import Stripe from "stripe";

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
    const { plan } = body; // "starter", "pro", "enterprise"

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalide. Choisissez parmi: starter, pro, enterprise" },
        { status: 400 }
      );
    }

    // Vérifier si l'agence a déjà un abonnement actif
    // Si oui, Stripe gérera automatiquement le changement de plan via le Customer Portal
    // Ici, on crée une nouvelle session pour un nouvel abonnement ou un upgrade

    const priceId = getStripePriceIdForPlan(plan as "starter" | "pro" | "enterprise");

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
        plan: plan,
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
        plan: plan,
      },
      // Permettre la mise à jour de l'abonnement si un abonnement existe déjà
      // Stripe gérera automatiquement le changement de plan
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
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
