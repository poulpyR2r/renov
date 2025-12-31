import { NextRequest, NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/models/Newsletter";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, consentGiven } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Le consentement est requis" },
        { status: 400 }
      );
    }

    // Get IP and User-Agent for RGPD compliance
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if user is logged in
    const session = await auth();
    let userId: string | undefined;
    let userName: string | undefined;

    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email);
      if (user) {
        userId = user._id?.toString();
        userName = user.name || name;
      }
    }

    const subscription = await subscribeToNewsletter(email, {
      userId,
      name: userName || name,
      consentIp: ip,
      consentUserAgent: userAgent,
      source: session?.user ? "user_account" : "guest_popup",
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement réussi",
      subscription: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt,
      },
    });
  } catch (error: any) {
    console.error("Error subscribing to newsletter:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Cet email est déjà abonné" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de l'abonnement" },
      { status: 500 }
    );
  }
}

