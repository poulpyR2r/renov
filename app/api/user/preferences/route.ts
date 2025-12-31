import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, getUserModel } from "@/models/User";

/**
 * PATCH /api/user/preferences
 * Update user preferences (dark mode, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { darkMode, emailPreferences } = body;

    const User = await getUserModel();
    const update: any = { updatedAt: new Date() };

    if (darkMode !== undefined) {
      update.darkMode = darkMode;
    }

    if (emailPreferences) {
      // Merge avec les préférences existantes
      const currentPreferences = user.emailPreferences || {};
      update.emailPreferences = {
        ...currentPreferences,
        ...emailPreferences,
      };
    }

    const result = await User.updateOne(
      { _id: user._id },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Préférences mises à jour avec succès",
      darkMode,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

