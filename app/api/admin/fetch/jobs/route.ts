import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const db = await dbConnect();
    const jobs = await db
      .collection("fetchJobs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

