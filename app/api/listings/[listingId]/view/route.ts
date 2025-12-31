import { NextRequest, NextResponse } from "next/server";
import { incrementListingViews, getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { success: false, error: "ID d'annonce invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'annonce existe et appartient à une agence
    const Listing = await getListingModel();
    const listing = await Listing.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Incrémenter les vues seulement pour les annonces d'agence
    if (listing.agencyId) {
      await incrementListingViews(listingId);

      return NextResponse.json({
        success: true,
        message: "Vue comptabilisée",
        views: (listing.views || 0) + 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Annonce non-agence, vue non comptabilisée",
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du tracking" },
      { status: 500 }
    );
  }
}
