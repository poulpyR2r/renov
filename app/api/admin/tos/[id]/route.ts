import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getTermsOfServiceById, updateTermsOfService } from "@/models/TermsOfService";

/**
 * GET /api/admin/tos/:id
 * Récupérer une version complète par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;
    const tos = await getTermsOfServiceById(id);

    if (!tos) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tos: {
        id: tos._id?.toString(),
        type: tos.type,
        version: tos.version,
        title: tos.title,
        content: tos.content,
        status: tos.status,
        isCurrent: tos.isCurrent,
        publishedAt: tos.publishedAt,
        createdByAdminId: tos.createdByAdminId,
        updatedByAdminId: tos.updatedByAdminId,
        createdAt: tos.createdAt,
        updatedAt: tos.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/tos/:id
 * Mettre à jour une version DRAFT uniquement
 */
export async function PATCH(
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
    const { title, content, version } = body;

    // Validation
    if (content !== undefined && (typeof content !== "string" || content.trim().length === 0)) {
      return NextResponse.json(
        { error: "Le contenu ne peut pas être vide" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (version !== undefined) updateData.version = version;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    const result = await updateTermsOfService(id, updateData, adminCheck._id?.toString());

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
    console.error("Error updating TermsOfService:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
