import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getFeedbackById } from "@/models/Feedback";
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
    if (!user || user.role !== "agency" || !user.agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas une agence" },
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

    // Vérifier que le feedback appartient à l'agence de l'utilisateur
    const feedbackAgencyId = typeof feedback.agencyId === "string"
      ? feedback.agencyId
      : feedback.agencyId.toString();
    const userAgencyId = typeof user.agencyId === "string"
      ? user.agencyId
      : user.agencyId.toString();

    if (feedbackAgencyId !== userAgencyId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
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

