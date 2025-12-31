import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getAlertById } from "@/models/Alert";
import { previewMatchingListings } from "@/lib/alert-matcher";

// GET: Preview matching listings for an alert
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { alertId } = await params;
    const alert = await getAlertById(alertId, user._id.toString());

    if (!alert) {
      return NextResponse.json(
        { error: "Alerte non trouvée" },
        { status: 404 }
      );
    }

    // Use the preview function (no date filter)
    const { listings, totalCount } = await previewMatchingListings(
      alert.filters,
      10
    );

    return NextResponse.json({
      success: true,
      totalCount,
      listings: listings.map((l) => ({
        _id: l._id.toString(),
        title: l.title,
        price: l.price,
        surface: l.surface,
        propertyType: l.propertyType,
        city: l.location?.city,
        department: l.location?.department,
        image: l.images?.[0],
        renovationScore: l.renovationScore,
        createdAt: l.createdAt,
      })),
      filtersApplied: alert.filters,
    });
  } catch (error) {
    console.error("Error previewing alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
