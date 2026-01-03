import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById, getAgencyActiveListingsCount } from "@/models/Agency";
import { getPackConfig, PackType } from "@/lib/packs";
import { getCpcParams } from "@/lib/pack-permissions";
import { getAgencyContactsCount } from "@/models/Contact";

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

    // Get current active listings count
    const agencyIdStr = agency._id?.toString() || "";
    const currentListings = await getAgencyActiveListingsCount(agencyIdStr);

    // Get pack configuration
    const pack = (agency.subscription?.pack as PackType) || "FREE";
    const packConfig = getPackConfig(pack);
    const cpcParams = getCpcParams(pack, 0.5);

    // Get contacts count (only for packs that can see it)
    let contactsCount = 0;
    if (packConfig.stats.contacts) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      contactsCount = await getAgencyContactsCount(agencyIdStr, startOfMonth);
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          pack,
          packName: packConfig.name,
          maxListings: packConfig.maxActiveListings,
          startDate: agency.subscription?.startDate || agency.createdAt,
          endDate: agency.subscription?.endDate,
          autoRenew: agency.subscription?.autoRenew || false,
        },
        // Stripe info
        stripeCustomerId: agency.stripeCustomerId,
        stripeSubscriptionId: agency.stripeSubscriptionId,
        stripeSubscriptionStatus: agency.stripeSubscriptionStatus,
        stripeSubscriptionCurrentPeriodEnd: agency.stripeSubscriptionCurrentPeriodEnd,
        // CPC info
        cpc: {
          balance: agency.cpc?.balance || 0,
          totalSpent: agency.cpc?.totalSpent || 0,
          costPerClick: cpcParams.pricePerClick,
          discount: cpcParams.discount,
          maxDurationDays: cpcParams.maxDurationDays,
          clicksThisMonth: agency.cpc?.clicksThisMonth || 0,
          lastRechargeAt: agency.cpc?.lastRechargeAt,
        },
        // Pack features
        packFeatures: {
          mapHighlight: packConfig.mapHighlight,
          autoBoost: packConfig.autoBoost,
          badge: packConfig.features.badge,
          prioritySupport: packConfig.features.prioritySupport,
          canViewContacts: packConfig.stats.contacts,
          canViewAdvancedStats: packConfig.stats.performancePerListing,
        },
        // Stats
        currentListings,
        contactsThisMonth: packConfig.stats.contacts ? contactsCount : null,
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
