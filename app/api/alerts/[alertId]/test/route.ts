import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getAlertById } from "@/models/Alert";
import { previewMatchingListings } from "@/lib/alert-matcher";
import { sendAlertEmail, ListingAlert } from "@/lib/email";

// POST: Test send an alert email
export async function POST(
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

    // Get matching listings (without date filter for test)
    const { listings, totalCount } = await previewMatchingListings(
      alert.filters,
      5 // Limit to 5 for test email
    );

    if (totalCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Aucune annonce ne correspond à cette alerte",
        totalCount: 0,
      });
    }

    // Prepare email data
    const emailListings: ListingAlert[] = listings.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      price: l.price || 0,
      city: l.location?.city || "Ville inconnue",
      surface: l.surface,
      imageUrl: l.images?.[0],
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/l/${
        l._id
      }`,
    }));

    // Send test email
    const result = await sendAlertEmail(
      user.email,
      user.name || "Utilisateur",
      `[TEST] ${alert.name}`,
      emailListings
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email de test envoyé à ${user.email}`,
        totalCount,
        listingsSent: listings.length,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Erreur lors de l'envoi de l'email",
      });
    }
  } catch (error) {
    console.error("Error testing alert:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + String(error) },
      { status: 500 }
    );
  }
}
