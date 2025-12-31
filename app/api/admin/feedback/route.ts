import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getAllFeedbacks } from "@/models/Feedback";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const agencyId = searchParams.get("agencyId") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const feedbacks = await getAllFeedbacks({
      status,
      category,
      severity,
      agencyId,
      search,
      startDate,
      endDate,
    });

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

