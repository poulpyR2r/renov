import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getCpcCostForPlan } from "@/lib/stripe-config";

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

    const balance = agency.cpc?.balance || 0;
    const plan = agency.subscription?.plan || "free";
    const baseCost = agency.cpc?.costPerClick || 0.5;
    const costPerClick = getCpcCostForPlan(plan, baseCost);
    const hasEnoughCredits = balance >= costPerClick;

    return NextResponse.json({
      success: true,
      hasEnoughCredits,
      balance,
      costPerClick,
      message: hasEnoughCredits
        ? "Vous avez suffisamment de crédits"
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

