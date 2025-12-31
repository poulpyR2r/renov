import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getListingModel } from "@/models/Listing";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const Listing = await getListingModel();

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const total = await Listing.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({
        title: 1,
        price: 1,
        surface: 1,
        rooms: 1,
        propertyType: 1,
        status: 1,
        location: 1,
        images: { $slice: 1 },
        renovationScore: 1,
        sourceId: 1,
        sourceName: 1,
        createdAt: 1,
      })
      .toArray();

    return NextResponse.json({
      success: true,
      listings,
      total,
      pages,
      page,
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

