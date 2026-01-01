import { NextRequest, NextResponse } from "next/server";
import { incrementListingClicks, getListingModel } from "@/models/Listing";
import { getAgencyById, debitAgencyCpc } from "@/models/Agency";
import { getCpcCostForPlan } from "@/lib/stripe-config";
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

    // Incrémenter les clics seulement pour les annonces d'agence
    if (listing.agencyId) {
      await incrementListingClicks(listingId);
      console.log(
        `[CPC] Clic tracké pour annonce ${listingId}, agencyId: ${listing.agencyId}`
      );

      // Si l'annonce est sponsorisée, débiter le budget CPC
      if (listing.isSponsored) {
        console.log(`[CPC] Annonce sponsorisée détectée`);

        if (!listing.agencyId) {
          console.error(
            `[CPC] Erreur: agencyId manquant pour l'annonce ${listingId}`
          );
        } else {
          const agencyIdStr = listing.agencyId.toString
            ? listing.agencyId.toString()
            : String(listing.agencyId);
          console.log(`[CPC] agencyId converti: ${agencyIdStr}`);

          const agency = await getAgencyById(agencyIdStr);
          console.log(`[CPC] Agence trouvée:`, agency ? "Oui" : "Non");

          if (agency && agency.cpc) {
            // Calculer le coût CPC avec réduction selon le plan
            const plan = agency.subscription?.plan || "free";
            const baseCost = agency.cpc.costPerClick || 0.5;
            const costPerClick = getCpcCostForPlan(plan, baseCost);
            console.log(
              `[CPC] Budget avant débit: ${agency.cpc.balance}€, coût de base: ${baseCost}€, plan: ${plan}, coût réel: ${costPerClick}€`
            );
            const debitResult = await debitAgencyCpc(agencyIdStr, costPerClick);
            console.log(`[CPC] Résultat débit:`, debitResult);

            if (!debitResult.success) {
              // Si le budget est épuisé, désactiver le sponsoring
              const Listing = await getListingModel();
              await Listing.updateOne(
                { _id: new ObjectId(listingId) },
                { $set: { isSponsored: false, updatedAt: new Date() } }
              );

              return NextResponse.json({
                success: true,
                message:
                  "Clic comptabilisé, mais budget CPC épuisé - sponsoring désactivé",
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
          } else {
            console.log(`[CPC] Agence non trouvée ou pas de CPC configuré`);
          }
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
