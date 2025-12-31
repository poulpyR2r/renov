import { NextRequest, NextResponse } from "next/server";
import { createUserWithPassword } from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Le nom doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    // Create user
    const result = await createUserWithPassword({ email, password, name });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
