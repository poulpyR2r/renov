import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getListingModel, getListingFavoritesCount } from "@/models/Listing";
import { getCpcCostForPlan } from "@/lib/stripe-config";
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

    // Get listings stats
    const Listing = await getListingModel();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get agency listings - chercher par ObjectId ou string
    const agencyIdStr = agency._id?.toString();
    const listings = await Listing.find({
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any).toArray();

    const activeListings = listings.filter((l) => l.status === "active");
    const sponsoredListings = listings.filter((l) => l.isSponsored);

    // Calculate stats
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
        const favoritesCount = await getListingFavoritesCount(
          l._id!.toString()
        );
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

    return NextResponse.json({
      success: true,
      data: {
        agency: {
          companyName: agency.companyName,
          status: agency.status,
        },
        subscription: {
          plan: agency.subscription?.plan || "free",
          maxListings: agency.subscription?.maxListings || 5,
          endDate: agency.subscription?.endDate,
        },
        cpc: {
          balance: agency.cpc?.balance || 0,
          clicksThisMonth: agency.cpc?.clicksThisMonth || 0,
          costPerClick: getCpcCostForPlan(
            agency.subscription?.plan || "free",
            agency.cpc?.costPerClick || 0.5
          ),
        },
        stats: {
          totalListings: listings.length,
          activeListings: activeListings.length,
          sponsoredListings: sponsoredListings.length,
          totalViews,
          totalClicks,
          totalFavorites,
          viewsThisMonth: totalViews, // Pour l'instant, on montre toutes les vues
          clicksThisMonth: totalClicks, // Pour l'instant, on montre tous les clics
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
