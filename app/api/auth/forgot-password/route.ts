import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

// Obtenir l'URL de base de l'application
function getBaseUrl(request: NextRequest): string {
  // Priorité aux variables d'environnement
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Sinon, construire à partir de la requête
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const User = await getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Expiration dans 1 heure
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarder le token hashé dans la base
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpiry: resetTokenExpiry,
        },
      }
    );

    // Envoyer l'email
    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendPasswordResetEmail(email, user.name || "Utilisateur", resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
