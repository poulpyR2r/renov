import { NextRequest, NextResponse } from "next/server";
import { getAgencyById } from "@/models/Agency";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const { agencyId } = await params;

    // Récupérer l'agence
    const agency = await getAgencyById(agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'agence est vérifiée (seules les agences vérifiées sont publiques)
    if (agency.status !== "verified") {
      return NextResponse.json(
        { error: "Agence non disponible" },
        { status: 404 }
      );
    }

    // Récupérer les annonces actives de l'agence
    const Listing = await getListingModel();
    const agencyIdObj = agency._id;
    const agencyIdStr = agencyIdObj?.toString();

    const listings = await Listing.find({
      $or: [{ agencyId: agencyIdObj }, { agencyId: agencyIdStr }],
      status: "active",
    } as any)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Retourner les informations publiques de l'agence
    return NextResponse.json({
      success: true,
      agency: {
        _id: agency._id?.toString(),
        companyName: agency.companyName,
        tradeName: agency.tradeName,
        address: agency.address,
        phone: agency.phone,
        email: agency.email,
        website: agency.website,
        logo: agency.logo,
        description: agency.description,
        listingsCount: agency.listingsCount,
      },
      listings: listings.map((l) => ({
        _id: l._id?.toString(),
        title: l.title,
        price: l.price,
        location: l.location,
        propertyType: l.propertyType,
        surface: l.surface,
        rooms: l.rooms,
        bedrooms: l.bedrooms,
        images: l.images,
        renovationScore: l.renovationScore,
        createdAt: l.createdAt,
        views: l.views || 0,
        clicks: l.clicks || 0,
        isSponsored: l.isSponsored || false,
      })),
    });
  } catch (error) {
    console.error("Error fetching public agency data:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
