import { NextRequest, NextResponse } from "next/server";
import { unsubscribeFromNewsletter, getNewsletterModel } from "@/models/Newsletter";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    // If token provided, use it
    if (token) {
      const success = await unsubscribeFromNewsletter(token);
      if (success) {
        return NextResponse.json({
          success: true,
          message: "Désabonnement réussi",
        });
      }
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 404 }
      );
    }

    // If email provided and user is logged in
    if (email) {
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Non authentifié" },
          { status: 401 }
        );
      }

      const user = await getUserByEmail(session.user.email);
      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email ne correspond pas à votre compte" },
          { status: 403 }
        );
      }

      const Newsletter = await getNewsletterModel();
      const result = await Newsletter.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            isSubscribed: false,
            unsubscribedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json({
          success: true,
          message: "Désabonnement réussi",
        });
      }

      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Token ou email requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    return NextResponse.json(
      { error: "Erreur lors du désabonnement" },
      { status: 500 }
    );
  }
}

