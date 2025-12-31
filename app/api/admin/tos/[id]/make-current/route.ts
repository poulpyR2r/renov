import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { makeCurrentTermsOfService } from "@/models/TermsOfService";

/**
 * POST /api/admin/tos/:id/make-current
 * Définir une version comme courante (transaction : une seule version courante)
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
    const result = await makeCurrentTermsOfService(id, adminCheck._id?.toString());

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
        status: result.tos?.status,
        isCurrent: result.tos?.isCurrent,
        updatedAt: result.tos?.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error making current TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
