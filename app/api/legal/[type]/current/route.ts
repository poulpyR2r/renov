import { NextRequest, NextResponse } from "next/server";
import { getCurrentTermsOfService, LegalDocumentType } from "@/models/TermsOfService";

const VALID_TYPES: LegalDocumentType[] = [
  "CGU",
  "MENTIONS_LEGALES",
  "POLITIQUE_CONFIDENTIALITE",
  "POLITIQUE_COOKIES",
  "CGV",
];

/**
 * GET /api/legal/[type]/current
 * Récupérer la version courante d'un type de document légal (endpoint public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const normalizedType = type.toUpperCase() as LegalDocumentType;

    if (!VALID_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        { error: "Type de document invalide" },
        { status: 400 }
      );
    }

    const tos = await getCurrentTermsOfService(normalizedType);

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
    console.error("Error fetching current legal document:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
