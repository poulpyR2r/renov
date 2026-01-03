import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getCpcCostForPack, getCpcMaxDurationDays, BASE_CPC_COST } from "@/lib/stripe-config";
import { PackType, getPackConfig } from "@/lib/packs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
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

    // ✅ Utiliser le pack au lieu du plan
    const pack: PackType = agency.subscription?.pack || "FREE";
    const packConfig = getPackConfig(pack);
    
    const balance = agency.cpc?.balance || 0;
    const baseCost = agency.cpc?.costPerClick || BASE_CPC_COST;
    const costPerClick = getCpcCostForPack(pack, baseCost);
    const maxDurationDays = getCpcMaxDurationDays(pack);
    const hasEnoughCredits = balance >= costPerClick;

    return NextResponse.json({
      success: true,
      hasEnoughCredits,
      balance,
      costPerClick,
      baseCost,
      // ✅ Infos sur le pack
      pack,
      packName: packConfig.name,
      cpcDiscount: packConfig.cpcDiscount,
      maxDurationDays,
      // Estimation du nombre de clics possibles
      estimatedClicks: balance > 0 ? Math.floor(balance / costPerClick) : 0,
      message: hasEnoughCredits
        ? `Vous avez suffisamment de crédits (${Math.floor(balance / costPerClick)} clics)`
        : "Crédits CPC insuffisants",
    });
  } catch (error) {
    console.error("Error checking CPC credits:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

