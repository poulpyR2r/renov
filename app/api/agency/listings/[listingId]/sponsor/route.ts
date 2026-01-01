export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId, getAgencyModel } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getListingModel, toggleListingSponsored } from "@/models/Listing";
import { getCpcCostForPlan } from "@/lib/stripe-config";
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
    const { isSponsored } = body;

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const Listing = await getListingModel();

    // Verify listing belongs to agency - check both ObjectId and string formats
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

    // Check if enabling sponsoring and has budget
    if (isSponsored) {
      const plan = agency.subscription?.plan || "free";
      const baseCost = agency.cpc?.costPerClick || 0.5;
      const costPerClick = getCpcCostForPlan(plan, baseCost);
      
      if (!agency.cpc || agency.cpc.balance < costPerClick) {
        return NextResponse.json(
          { error: "Budget CPC insuffisant. Veuillez recharger votre compte." },
          { status: 400 }
        );
      }
    }

    await toggleListingSponsored(listingId, isSponsored);

    return NextResponse.json({
      success: true,
      message: isSponsored
        ? "Annonce sponsorisée avec succès"
        : "Sponsoring désactivé",
    });
  } catch (error) {
    console.error("Error updating listing sponsor:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
