import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getAgencyByOwnerId, getAgencyById } from "@/models/Agency";
import { createFeedback, getFeedbacksByAgency } from "@/models/Feedback";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, message, category, severity, pageUrl } = body;

    if (!title || !message || !category) {
      return NextResponse.json(
        { error: "Titre, message et catégorie sont requis" },
        { status: 400 }
      );
    }

    if (!["BUG", "FEATURE_REQUEST", "IMPROVEMENT", "OTHER"].includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide" },
        { status: 400 }
      );
    }

    const agencyId = typeof user.agencyId === "string" 
      ? new ObjectId(user.agencyId) 
      : user.agencyId;

    const feedbackId = await createFeedback({
      agencyId,
      createdByUserId: user._id!,
      title,
      message,
      category,
      severity: severity || undefined,
      status: "OPEN",
      pageUrl: pageUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      data: { id: feedbackId.toString() },
    });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const agencyId = typeof user.agencyId === "string" 
      ? user.agencyId 
      : user.agencyId.toString();

    const feedbacks = await getFeedbacksByAgency(agencyId);

    return NextResponse.json({
      success: true,
      data: feedbacks,
    });
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des feedbacks" },
      { status: 500 }
    );
  }
}

