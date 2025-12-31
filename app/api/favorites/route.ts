import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, getUserFavorites } from "@/models/User";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

// GET: Récupérer les favoris de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const full = searchParams.get("full") === "true";

    if (full) {
      // Retourner les annonces complètes
      const Listing = await getListingModel();
      const favoriteIds = user.favorites
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const listings = await Listing.find({
        _id: { $in: favoriteIds },
        status: "active",
      }).toArray();

      return NextResponse.json({ favorites: listings });
    }

    // Retourner juste les IDs
    return NextResponse.json({ favorites: user.favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
