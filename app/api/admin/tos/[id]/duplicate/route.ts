import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getTermsOfServiceById, duplicateTermsOfService } from "@/models/TermsOfService";

/**
 * POST /api/admin/tos/:id/duplicate
 * Dupliquer une version (créer une copie en DRAFT)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;
    const body = await request.json();
    const { newVersion } = body;

    if (!newVersion) {
      return NextResponse.json(
        { error: "Le champ newVersion est obligatoire" },
        { status: 400 }
      );
    }

    const result = await duplicateTermsOfService(
      id,
      newVersion,
      adminCheck._id?.toString()
    );

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
    console.error("Error duplicating TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
