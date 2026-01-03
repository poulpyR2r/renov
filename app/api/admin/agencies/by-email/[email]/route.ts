import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getAgencyModel } from "@/models/Agency";
import { PackType, getPackConfig } from "@/lib/packs";

/**
 * GET /api/admin/agencies/by-email/[email]
 * Récupère une agence par email (admin only)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { email } = await context.params;
    const decodedEmail = decodeURIComponent(email);

    const Agency = await getAgencyModel();
    const agency = await Agency.findOne({ email: decodedEmail });

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée avec cet email" },
        { status: 404 }
      );
    }

    const pack = (agency.subscription?.pack as PackType) || "FREE";

    return NextResponse.json({
      success: true,
      agencyId: agency._id?.toString(),
      companyName: agency.companyName,
      email: agency.email,
      pack,
      packConfig: getPackConfig(pack),
      subscription: agency.subscription,
      stripeCustomerId: agency.stripeCustomerId,
      stripeSubscriptionId: agency.stripeSubscriptionId,
      stripeSubscriptionStatus: agency.stripeSubscriptionStatus,
    });
  } catch (error) {
    console.error("Error getting agency by email:", error);
    return NextResponse.json(
      { error: "Erreur" },
      { status: 500 }
    );
  }
}
