import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getCpcTransactionsByAgency } from "@/models/CpcTransaction";

export async function GET(request: NextRequest) {
  try {
    // Only MANAGER and ADMIN can access transactions
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const transactions = await getCpcTransactionsByAgency(
      authResult.agencyId,
      limit
    );

    // Sérialiser les transactions pour les envoyer au client
    const serializedTransactions = transactions.map((tx) => ({
      _id: tx._id?.toString(),
      agencyId: tx.agencyId.toString(),
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      creditsAdded: tx.creditsAdded,
      description: tx.description,
      stripePaymentIntentId: tx.stripePaymentIntentId,
      stripeChargeId: tx.stripeChargeId,
      stripeCheckoutSessionId: tx.stripeCheckoutSessionId,
      metadata: tx.metadata,
      createdAt: tx.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      transactions: serializedTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des transactions" },
      { status: 500 }
    );
  }
}
