import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { stripe } from "@/lib/stripe-config";
import { getStripePriceIdForCpcPack } from "@/lib/stripe-config";

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
    const { pack } = body; // "pack20", "pack50", "pack100", "pack200"

    if (!pack || !["pack20", "pack50", "pack100", "pack200"].includes(pack)) {
      return NextResponse.json(
        { error: "Pack invalide. Choisissez parmi: pack20, pack50, pack100, pack200" },
        { status: 400 }
      );
    }

    const priceId = getStripePriceIdForCpcPack(pack as "pack20" | "pack50" | "pack100" | "pack200");

    // Créer ou récupérer le Stripe Customer
    const customerId = await getOrCreateStripeCustomer(
      authResult.agencyId,
      agency.email,
      agency.companyName
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Créer la Checkout Session (mode=payment pour paiement unique)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}&type=cpc`,
      cancel_url: `${baseUrl}/stripe/cancel?type=cpc`,
      metadata: {
        agencyId: authResult.agencyId,
        type: "cpc",
        pack: pack,
      },
      // Idempotency key basé sur l'agence + pack + timestamp (minute)
      // Cela évite les doublons si l'utilisateur clique plusieurs fois rapidement
      client_reference_id: `cpc-${authResult.agencyId}-${pack}-${Math.floor(Date.now() / 60000)}`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating CPC checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
