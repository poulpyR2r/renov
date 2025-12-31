import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getFeedbackById, updateFeedback } from "@/models/Feedback";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const feedback = await getFeedbackById(id);

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération du feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNote, adminReply, assignToAdminId } = body;

    const updates: any = {};
    if (status !== undefined) {
      if (!["OPEN", "IN_REVIEW", "PLANNED", "DONE", "REJECTED"].includes(status)) {
        return NextResponse.json(
          { error: "Statut invalide" },
          { status: 400 }
        );
      }
      updates.status = status;
    }
    if (adminNote !== undefined) {
      updates.adminNote = adminNote;
    }
    if (adminReply !== undefined) {
      updates.adminReply = adminReply;
    }
    if (assignToAdminId !== undefined) {
      updates.assignToAdminId = assignToAdminId ? new ObjectId(assignToAdminId) : null;
    }

    await updateFeedback(id, updates);

    const updatedFeedback = await getFeedbackById(id);

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
    });
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour du feedback" },
      { status: 500 }
    );
  }
}

