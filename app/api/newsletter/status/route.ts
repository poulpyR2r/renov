import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getNewsletterModel } from "@/models/Newsletter";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({
        success: true,
        isSubscribed: false,
        isLoggedIn: false,
      });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({
        success: true,
        isSubscribed: false,
        isLoggedIn: true,
      });
    }

    // Check newsletter subscription
    const Newsletter = await getNewsletterModel();
    const subscription = await Newsletter.findOne({
      email: user.email.toLowerCase(),
      isSubscribed: true,
    });

    return NextResponse.json({
      success: true,
      isSubscribed: !!subscription,
      isLoggedIn: true,
      emailPreferences: user.emailPreferences,
    });
  } catch (error) {
    console.error("Error checking newsletter status:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

