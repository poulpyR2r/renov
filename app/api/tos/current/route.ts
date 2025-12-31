import { NextRequest, NextResponse } from "next/server";
import { getCurrentTermsOfService } from "@/models/TermsOfService";

/**
 * GET /api/tos/current
 * Récupérer la version courante des CGU (endpoint public)
 */
export async function GET(request: NextRequest) {
  try {
    const tos = await getCurrentTermsOfService();

    if (!tos) {
      return NextResponse.json(
        { error: "Aucune version courante disponible" },
        { status: 404 }
      );
    }

    // Ne retourner que les informations publiques
    return NextResponse.json({
      success: true,
      tos: {
        version: tos.version,
        title: tos.title,
        content: tos.content,
        publishedAt: tos.publishedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching current TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
