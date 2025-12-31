import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole, getUserAgencyRoleFromSession } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";

export async function GET(request: NextRequest) {
  try {
    // Allow all roles to get agency info
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agency: {
        _id: agency._id?.toString() || agency._id,
        companyName: agency.companyName,
        status: agency.status,
        rejectionReason: agency.rejectionReason,
        createdAt: agency.createdAt,
        verifiedAt: agency.verifiedAt,
      },
      role: authResult.role, // Include user's role
    });
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}
