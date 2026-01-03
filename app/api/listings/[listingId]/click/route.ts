import { NextRequest, NextResponse } from "next/server";
import { incrementListingClicks, getListingModel } from "@/models/Listing";
import { getAgencyById, debitAgencyCpc } from "@/models/Agency";
import { getCpcCostForPack, BASE_CPC_COST } from "@/lib/stripe-config";
import { PackType } from "@/lib/packs";
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

    const Listing = await getListingModel();
    const listing = await Listing.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Incrémenter les clics seulement pour les annonces d'agence
    if (listing.agencyId) {
      await incrementListingClicks(listingId);
      console.log(
        `[CPC] Clic tracké pour annonce ${listingId}, agencyId: ${listing.agencyId}`
      );

      // ✅ Vérifier si l'annonce est sponsorisée ET si la durée n'est pas expirée
      const now = new Date();
      const isStillSponsored = listing.isSponsored && 
        (!listing.sponsoredUntil || new Date(listing.sponsoredUntil) > now);

      if (listing.isSponsored && !isStillSponsored) {
        // ✅ Désactiver automatiquement le sponsoring expiré
        await Listing.updateOne(
          { _id: new ObjectId(listingId) },
          { $set: { isSponsored: false, updatedAt: now } }
        );
        console.log(`[CPC] Sponsoring expiré pour l'annonce ${listingId}`);
      }

      if (isStillSponsored) {
        console.log(`[CPC] Annonce sponsorisée détectée`);

        // ✅ Vérifier si c'est un AUTO-BOOST GRATUIT (PRO/PREMIUM)
        if (listing.autoBoostApplied) {
          console.log(`[CPC] Auto-boost gratuit détecté - pas de débit CPC`);
          return NextResponse.json({
            success: true,
            message: "Clic comptabilisé (auto-boost gratuit)",
            clicks: (listing.clicks || 0) + 1,
            cpcDebited: false,
            autoBoost: true,
          });
        }

        // ✅ Sinon c'est un CPC payant, on débite
        const agencyIdStr = listing.agencyId.toString
          ? listing.agencyId.toString()
          : String(listing.agencyId);

        const agency = await getAgencyById(agencyIdStr);

        if (agency && agency.cpc) {
          // ✅ Utiliser le pack au lieu du plan
          const pack: PackType = agency.subscription?.pack || "FREE";
          const baseCost = agency.cpc.costPerClick || BASE_CPC_COST;
          const costPerClick = getCpcCostForPack(pack, baseCost);
          console.log(
            `[CPC] Budget: ${agency.cpc.balance}€, pack: ${pack}, coût: ${costPerClick}€`
          );
          
          const debitResult = await debitAgencyCpc(agencyIdStr, costPerClick);

          if (!debitResult.success) {
            // Budget épuisé - désactiver le sponsoring
            await Listing.updateOne(
              { _id: new ObjectId(listingId) },
              { $set: { isSponsored: false, updatedAt: now } }
            );

            return NextResponse.json({
              success: true,
              message: "Clic comptabilisé, budget CPC épuisé - sponsoring désactivé",
              clicks: (listing.clicks || 0) + 1,
              cpcDebited: false,
              budgetExhausted: true,
            });
          }

          return NextResponse.json({
            success: true,
            message: "Clic comptabilisé et budget CPC débité",
            clicks: (listing.clicks || 0) + 1,
            cpcDebited: true,
            newBalance: debitResult.newBalance,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Clic comptabilisé",
        clicks: (listing.clicks || 0) + 1,
        cpcDebited: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Annonce non-agence, clic non comptabilisé",
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du tracking" },
      { status: 500 }
    );
  }
}
