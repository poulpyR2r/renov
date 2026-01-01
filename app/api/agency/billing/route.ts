import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getListingModel } from "@/models/Listing";
import { getCpcCostForPlan } from "@/lib/stripe-config";

export async function GET(request: NextRequest) {
  try {
    // Only MANAGER and ADMIN can access billing
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

    // Get current listings count - chercher par ObjectId ou string
    const Listing = await getListingModel();
    const agencyIdStr = agency._id?.toString();
    const currentListings = await Listing.countDocuments({
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any);

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          plan: agency.subscription?.plan || "free",
          maxListings: agency.subscription?.maxListings || 5,
          startDate: agency.subscription?.startDate || agency.createdAt,
          endDate: agency.subscription?.endDate,
          autoRenew: agency.subscription?.autoRenew || false,
          stripeCustomerId: agency.stripeCustomerId,
          stripeSubscriptionId: agency.stripeSubscriptionId,
          stripeSubscriptionStatus: agency.stripeSubscriptionStatus,
          stripeSubscriptionCurrentPeriodEnd: agency.stripeSubscriptionCurrentPeriodEnd,
        },
        cpc: {
          balance: agency.cpc?.balance || 0,
          totalSpent: agency.cpc?.totalSpent || 0,
          costPerClick: getCpcCostForPlan(
            agency.subscription?.plan || "free",
            agency.cpc?.costPerClick || 0.5
          ),
          clicksThisMonth: agency.cpc?.clicksThisMonth || 0,
          lastRechargeAt: agency.cpc?.lastRechargeAt,
        },
        currentListings,
      },
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
