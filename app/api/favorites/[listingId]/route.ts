import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, addFavorite, removeFavorite } from "@/models/User";

// POST: Ajouter aux favoris
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
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

    const { listingId } = await params;
    await addFavorite(user._id.toString(), listingId);

    return NextResponse.json({
      success: true,
      message: "Ajouté aux favoris",
      isFavorite: true,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Retirer des favoris
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
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

    const { listingId } = await params;
    await removeFavorite(user._id.toString(), listingId);

    return NextResponse.json({
      success: true,
      message: "Retiré des favoris",
      isFavorite: false,
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
