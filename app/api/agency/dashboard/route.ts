import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId, getAgencyActiveListingsCount } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getListingModel, getListingFavoritesCount } from "@/models/Listing";
import { getCpcCostForPack, getCpcMaxDurationDays } from "@/lib/stripe-config";
import { PackType, getPackConfig, canViewStat } from "@/lib/packs";
import { getAgencyContactsCount } from "@/models/Contact";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
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

    // ✅ Récupérer le pack et sa configuration
    const pack: PackType = agency.subscription?.pack || "FREE";
    const packConfig = getPackConfig(pack);

    // Get listings stats
    const Listing = await getListingModel();
    const agencyIdStr = agency._id?.toString();
    
    const listings = await Listing.find({
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any).toArray();

    const activeListings = listings.filter((l) => l.status === "active");
    const sponsoredListings = listings.filter((l) => l.isSponsored);

    // Calculate stats (toujours visibles : vues et clics)
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalClicks = listings.reduce((sum, l) => sum + (l.clicks || 0), 0);

    // Get recent listings with favorites count
    const recentListingsPromises = listings
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map(async (l) => {
        const favoritesCount = await getListingFavoritesCount(l._id!.toString());
        return {
          _id: l._id?.toString(),
          title: l.title,
          views: l.views || 0,
          clicks: l.clicks || 0,
          favorites: favoritesCount,
          isSponsored: l.isSponsored || false,
          createdAt: l.createdAt,
        };
      });

    const recentListings = await Promise.all(recentListingsPromises);

    // Calculate total favorites
    const totalFavorites = await Promise.all(
      listings.map((l) => getListingFavoritesCount(l._id!.toString()))
    ).then((counts) => counts.reduce((sum, count) => sum + count, 0));

    // ✅ Compteur d'annonces actives pour limite
    const activeListingsCount = await getAgencyActiveListingsCount(agencyIdStr!);

    // ✅ Contacts (visible seulement pour STARTER+) - DONNÉES RÉELLES
    let totalContacts = 0;
    const canSeeContacts = canViewStat(pack, "contacts");
    if (canSeeContacts && agencyIdStr) {
      totalContacts = await getAgencyContactsCount(agencyIdStr);
    }

    return NextResponse.json({
      success: true,
      data: {
        agency: {
          companyName: agency.companyName,
          status: agency.status,
        },
        // ✅ Nouveau format avec pack
        pack: {
          type: pack,
          name: packConfig.name,
          maxActiveListings: packConfig.maxActiveListings,
          currentActiveListings: activeListingsCount,
          remainingListings: packConfig.maxActiveListings === -1 
            ? Infinity 
            : Math.max(0, packConfig.maxActiveListings - activeListingsCount),
          cpcDiscount: packConfig.cpcDiscount,
          cpcMaxDurationDays: packConfig.cpcMaxDurationDays,
          badge: packConfig.features.badge,
          // Stats visibles selon le pack
          visibleStats: {
            views: packConfig.stats.views,
            clicks: packConfig.stats.clicks,
            contacts: packConfig.stats.contacts,
            performancePerListing: packConfig.stats.performancePerListing,
            costPerContact: packConfig.stats.costPerContact,
            globalPerformance: packConfig.stats.globalPerformance,
            performanceByZone: packConfig.stats.performanceByZone,
          },
        },
        cpc: {
          balance: agency.cpc?.balance || 0,
          clicksThisMonth: agency.cpc?.clicksThisMonth || 0,
          costPerClick: getCpcCostForPack(pack, agency.cpc?.costPerClick || 0.5),
          baseCost: agency.cpc?.costPerClick || 0.5,
          discount: packConfig.cpcDiscount,
          maxDurationDays: getCpcMaxDurationDays(pack),
        },
        stats: {
          totalListings: listings.length,
          activeListings: activeListings.length,
          sponsoredListings: sponsoredListings.length,
          totalViews,
          totalClicks,
          totalFavorites,
          // ✅ Contacts (restreint selon pack)
          totalContacts: canSeeContacts ? totalContacts : null,
          contactsLocked: !canSeeContacts,
          viewsThisMonth: totalViews,
          clicksThisMonth: totalClicks,
        },
        recentListings,
      },
    });
  } catch (error) {
    console.error("Error fetching agency dashboard:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
