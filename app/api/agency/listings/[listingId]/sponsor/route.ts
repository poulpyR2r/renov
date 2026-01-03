export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getListingModel, toggleListingSponsored } from "@/models/Listing";
import { getCpcCostForPack, getCpcMaxDurationDays } from "@/lib/stripe-config";
import { PackType, getPackConfig } from "@/lib/packs";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || user.role !== "agency" || !user.agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas une agence" },
        { status: 403 }
      );
    }

    const agency = await getAgencyByOwnerId(user._id!.toString());
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const { listingId } = await params;
    const body = await request.json();
    const { isSponsored, duration } = body; // duration en jours (optionnel)

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const Listing = await getListingModel();

    // Verify listing belongs to agency
    const listing = await Listing.findOne({
      _id: new ObjectId(listingId),
      $or: [{ agencyId: agency._id }, { agencyId: agency._id?.toString() }],
    } as any);

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // ✅ Utiliser le pack au lieu du plan
    const pack: PackType = agency.subscription?.pack || "FREE";
    const packConfig = getPackConfig(pack);

    // Check if enabling sponsoring
    if (isSponsored) {
      const baseCost = agency.cpc?.costPerClick || 0.5;
      const costPerClick = getCpcCostForPack(pack, baseCost);
      
      // ✅ Vérifier le budget
      if (!agency.cpc || agency.cpc.balance < costPerClick) {
        return NextResponse.json(
          { error: "Budget CPC insuffisant. Veuillez recharger votre compte." },
          { status: 400 }
        );
      }

      // ✅ Vérifier et appliquer la durée max selon le pack
      const maxDurationDays = getCpcMaxDurationDays(pack);
      const requestedDuration = duration || maxDurationDays;
      const finalDuration = Math.min(requestedDuration, maxDurationDays);

      // Calculer les dates de sponsoring
      const sponsoredAt = new Date();
      const sponsoredUntil = new Date(sponsoredAt.getTime() + finalDuration * 24 * 60 * 60 * 1000);

      await Listing.updateOne(
        { _id: new ObjectId(listingId) },
        {
          $set: {
            isSponsored: true,
            sponsoredAt,
            sponsoredUntil,
            sponsorPack: pack,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Annonce sponsorisée pour ${finalDuration} jour(s)`,
        sponsorEndAt: sponsoredUntil,
        maxDurationDays,
        costPerClick,
        cpcDiscount: packConfig.cpcDiscount,
      });
    }

    // Désactiver le sponsoring
    await toggleListingSponsored(listingId, false);

    return NextResponse.json({
      success: true,
      message: "Sponsoring désactivé",
    });
  } catch (error) {
    console.error("Error updating listing sponsor:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
