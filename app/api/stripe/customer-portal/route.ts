import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { stripe } from "@/lib/stripe-config";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";

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

    // Créer ou récupérer le Stripe Customer
    // Le Customer Portal nécessite un customer Stripe, même sans abonnement actif
    const customerId = await getOrCreateStripeCustomer(
      authResult.agencyId,
      agency.email,
      agency.companyName
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Créer une session Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/agency/subscription`,
    });

    return NextResponse.json({
      success: true,
      portalUrl: portalSession.url,
    });
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de la session Customer Portal" },
      { status: 500 }
    );
  }
}
