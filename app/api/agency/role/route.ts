import { NextRequest, NextResponse } from "next/server";
import { getUserAgencyRoleFromSession } from "@/lib/agency-rbac";
import { getUserByEmail } from "@/models/User";
import { getAgencyById } from "@/models/Agency";

/**
 * GET /api/agency/role
 * Get current user's role in their agency
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId requis" }, { status: 400 });
    }

    // Verify agency exists
    const agency = await getAgencyById(agencyId);
    if (!agency) {
      return NextResponse.json({ error: "Agence non trouvée" }, { status: 404 });
    }

    const role = await getUserAgencyRoleFromSession(agencyId);

    if (!role) {
      return NextResponse.json({ error: "Vous n'appartenez pas à cette agence" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("Error fetching agency role:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

