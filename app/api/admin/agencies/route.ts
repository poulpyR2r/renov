import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAllAgencies, getAgencyStats } from "@/models/Agency";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") as
      | "pending"
      | "verified"
      | "rejected"
      | "suspended"
      | undefined;

    const [result, stats] = await Promise.all([
      getAllAgencies(page, 20, status === null ? undefined : status),
      getAgencyStats(),
    ]);

    return NextResponse.json({
      success: true,
      agencies: result.agencies,
      total: result.total,
      pages: result.pages,
      stats,
    });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des agences" },
      { status: 500 }
    );
  }
}

