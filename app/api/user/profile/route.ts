import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, getUserModel } from "@/models/User";
import { ObjectId } from "mongodb";

/**
 * GET /api/user/profile
 * Get current user profile information
 */
export async function GET(request: NextRequest) {
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

    // Split name into firstName and lastName if possible
    const nameParts = user.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return NextResponse.json({
      success: true,
      user: {
        firstName,
        lastName,
        email: user.email,
        name: user.name,
        darkMode: user.darkMode || false,
        emailPreferences: user.emailPreferences || {
          newsletter: false,
          alerts: true,
          marketing: false,
          messages: true, // Par défaut activé
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update user profile information
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
    const { firstName, lastName, email } = body;

    const User = await getUserModel();
    const update: any = { updatedAt: new Date() };

    // Update name if firstName or lastName provided
    if (firstName !== undefined || lastName !== undefined) {
      const currentNameParts = user.name?.split(" ") || [];
      const newFirstName = firstName !== undefined ? firstName : currentNameParts[0] || "";
      const newLastName = lastName !== undefined ? lastName : currentNameParts.slice(1).join(" ") || "";
      update.name = `${newFirstName} ${newLastName}`.trim();
    }

    // Update email if provided and different
    if (email !== undefined && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Format d'email invalide" },
          { status: 400 }
        );
      }

      // Check if email is already taken
      const existingUser = await getUserByEmail(email);
      if (existingUser && existingUser._id?.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }

      update.email = email.toLowerCase();
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
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

