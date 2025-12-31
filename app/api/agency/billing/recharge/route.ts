import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById, getAgencyModel } from "@/models/Agency";

export async function POST(request: NextRequest) {
  try {
    // Only MANAGER and ADMIN can recharge CPC
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
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

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Montant minimum: 10€" },
        { status: 400 }
      );
    }

    // In production, this would integrate with a payment provider (Stripe, etc.)
    // For now, we'll just add the amount directly (demo mode)

    const Agency = await getAgencyModel();
    await Agency.updateOne(
      { _id: agency._id },
      {
        $inc: { "cpc.balance": amount },
        $set: {
          "cpc.lastRechargeAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `${amount}€ ajoutés à votre budget CPC`,
      newBalance: (agency.cpc?.balance || 0) + amount,
    });
  } catch (error) {
    console.error("Error recharging CPC:", error);
    return NextResponse.json(
      { error: "Erreur lors du rechargement" },
      { status: 500 }
    );
  }
}

