import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getAgencyModel, getAgencyById } from "@/models/Agency";
import { PackType, getPackConfig } from "@/lib/packs";
import { ObjectId } from "mongodb";

/**
 * PATCH /api/admin/agencies/[agencyId]/pack
 * Met à jour le pack d'une agence (admin only)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agencyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { agencyId } = await context.params;
    const { pack, reason } = await request.json();

    // Valider le pack
    const validPacks: PackType[] = ["FREE", "STARTER", "PRO", "PREMIUM"];
    if (!pack || !validPacks.includes(pack)) {
      return NextResponse.json(
        { error: "Pack invalide. Choisissez parmi: FREE, STARTER, PRO, PREMIUM" },
        { status: 400 }
      );
    }

    const agency = await getAgencyById(agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const Agency = await getAgencyModel();
    const oldPack = agency.subscription?.pack || "FREE";
    const now = new Date();

    const updateOp: any = {
      $set: {
        "subscription.pack": pack,
        "subscription.startDate": now,
        "subscription.autoRenew": pack !== "FREE",
        updatedAt: now,
      },
    };

    // Ajouter à l'historique si le pack change
    if (oldPack !== pack) {
      updateOp.$push = {
        "subscription.history": {
          pack: oldPack,
          startDate: agency.subscription?.startDate || now,
          endDate: now,
          reason: reason || `Changement admin vers ${pack}`,
        },
      };
    }

    await Agency.updateOne(
      { _id: new ObjectId(agencyId) },
      updateOp
    );

    return NextResponse.json({
      success: true,
      message: `Pack mis à jour: ${oldPack} → ${pack}`,
      pack,
      packConfig: getPackConfig(pack),
    });
  } catch (error) {
    console.error("Error updating agency pack:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/agencies/[agencyId]/pack
 * Récupère le pack actuel d'une agence
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agencyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { agencyId } = await context.params;
    const agency = await getAgencyById(agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const pack = (agency.subscription?.pack as PackType) || "FREE";

    return NextResponse.json({
      success: true,
      agencyId,
      companyName: agency.companyName,
      pack,
      packConfig: getPackConfig(pack),
      subscription: agency.subscription,
      stripeSubscriptionId: agency.stripeSubscriptionId,
      stripeSubscriptionStatus: agency.stripeSubscriptionStatus,
    });
  } catch (error) {
    console.error("Error getting agency pack:", error);
    return NextResponse.json(
      { error: "Erreur" },
      { status: 500 }
    );
  }
}
