import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getAllTermsOfService,
  createTermsOfService,
  LegalDocumentType,
} from "@/models/TermsOfService";

const VALID_TYPES: LegalDocumentType[] = [
  "CGU",
  "MENTIONS_LEGALES",
  "POLITIQUE_CONFIDENTIALITE",
  "POLITIQUE_COOKIES",
  "CGV",
];

/**
 * GET /api/admin/tos
 * Liste paginée des versions des CGU
 */
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") as any;

    const result = await getAllTermsOfService(type, page, limit);

    // Sérialiser pour le client (enlever les ObjectId)
    const tos = result.tos.map((item) => ({
      id: item._id?.toString(),
      type: item.type,
      version: item.version,
      title: item.title,
      status: item.status,
      isCurrent: item.isCurrent,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      tos,
      total: result.total,
      pages: result.pages,
      page,
    });
  } catch (error) {
    console.error("Error fetching TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tos
 * Créer une nouvelle version en DRAFT
 */
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { type, version, title, content } = body;

    // Validation
    if (!type || !version || !title || !content) {
      return NextResponse.json(
        { error: "Les champs type, version, title et content sont obligatoires" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Type de document invalide" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu ne peut pas être vide" },
        { status: 400 }
      );
    }

    const result = await createTermsOfService({
      type,
      version,
      title,
      content,
      createdByAdminId: adminCheck._id?.toString(),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tos: {
        id: result.tos?._id?.toString(),
        type: result.tos?.type,
        version: result.tos?.version,
        title: result.tos?.title,
        content: result.tos?.content,
        status: result.tos?.status,
        isCurrent: result.tos?.isCurrent,
        createdAt: result.tos?.createdAt,
        updatedAt: result.tos?.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
