import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";

const SOURCES = ["leboncoin", "seloger", "pap", "bienici"];

export async function POST() {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const db = await dbConnect();

    // Create fetch jobs for all sources
    const jobs = SOURCES.map((sourceId) => ({
      sourceId,
      sourceName: sourceId,
      status: "pending",
      createdAt: new Date(),
    }));

    await db.collection("fetchJobs").insertMany(jobs);

    // Here you would trigger your actual scraping logic
    // For now, we just create the job records

    return NextResponse.json({
      success: true,
      message: `${SOURCES.length} fetch jobs créés`,
    });
  } catch (error) {
    console.error("Error running all fetches:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

