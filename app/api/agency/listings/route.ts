import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getAgencyListings, getListingFavoritesCount } from "@/models/Listing";

export async function GET(request: NextRequest) {
  try {
    // All roles can view listings
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const statusFilter = searchParams.get("status") || "all";

    const result = await getAgencyListings(
      agency._id!.toString(),
      page,
      20,
      sortBy,
      sortOrder,
      statusFilter
    );

    // Get favorites count for each listing
    const listingsWithFavorites = await Promise.all(
      result.listings.map(async (l) => {
        const favoritesCount = await getListingFavoritesCount(
          l._id!.toString()
        );
        return {
          _id: l._id?.toString(),
          title: l.title,
          price: l.price,
          location: l.location,
          images: l.images,
          status: l.status,
          isSponsored: l.isSponsored || false,
          views: l.views || 0,
          clicks: l.clicks || 0,
          favorites: favoritesCount,
          createdAt: l.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      listings: listingsWithFavorites,
      total: result.total,
      pages: result.pages,
    });
  } catch (error) {
    console.error("Error fetching agency listings:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
