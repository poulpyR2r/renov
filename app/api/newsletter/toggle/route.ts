import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, getUserModel } from "@/models/User";
import { subscribeToNewsletter, getNewsletterModel } from "@/models/Newsletter";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscribe } = body;

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Get IP and User-Agent for RGPD compliance
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (subscribe) {
      // Subscribe to newsletter
      await subscribeToNewsletter(user.email, {
        userId: user._id?.toString(),
        name: user.name,
        consentIp: ip,
        consentUserAgent: userAgent,
        source: "user_account",
      });

      // Also update user preferences
      const User = await getUserModel();
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            "emailPreferences.newsletter": true,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "Abonnement réussi",
        isSubscribed: true,
      });
    } else {
      // Unsubscribe from newsletter
      const Newsletter = await getNewsletterModel();
      await Newsletter.updateOne(
        { email: user.email.toLowerCase() },
        {
          $set: {
            isSubscribed: false,
            unsubscribedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // Also update user preferences
      const User = await getUserModel();
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            "emailPreferences.newsletter": false,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "Désabonnement réussi",
        isSubscribed: false,
      });
    }
  } catch (error) {
    console.error("Error toggling newsletter subscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

