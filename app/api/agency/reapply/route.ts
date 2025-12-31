import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgencyByOwnerId, getAgencyModel } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
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

    const agency = await getAgencyByOwnerId(user._id!.toString());

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    if (agency.status !== "rejected") {
      return NextResponse.json(
        { error: "Seules les agences rejetées peuvent refaire une demande" },
        { status: 400 }
      );
    }

    // Réinitialiser le statut à "pending"
    const Agency = await getAgencyModel();
    await Agency.updateOne(
      { _id: new ObjectId(agency._id) },
      {
        $set: {
          status: "pending",
          updatedAt: new Date(),
        },
        $unset: {
          rejectionReason: "",
          verifiedAt: "",
          verifiedBy: "",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Votre demande a été soumise à nouveau. Nous l'examinerons sous 48h.",
    });
  } catch (error) {
    console.error("Error reapplying:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}
