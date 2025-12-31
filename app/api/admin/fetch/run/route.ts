import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId requis" },
        { status: 400 }
      );
    }

    const db = await dbConnect();

    // Create a new fetch job
    const job = {
      sourceId,
      sourceName: sourceId,
      status: "pending",
      createdAt: new Date(),
    };

    await db.collection("fetchJobs").insertOne(job);

    // Here you would trigger your actual scraping logic
    // For now, we just create the job record
    // You can integrate with your existing scraping system

    return NextResponse.json({
      success: true,
      message: `Fetch job créé pour ${sourceId}`,
    });
  } catch (error) {
    console.error("Error running fetch:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

