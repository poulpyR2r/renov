import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { stripe } from "@/lib/stripe-config";

export async function GET(request: NextRequest) {
  try {
    // Only MANAGER and ADMIN can access invoices
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

    if (!agency.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        invoices: [],
      });
    }

    // Récupérer les factures Stripe pour ce customer
    const invoices = await stripe.invoices.list({
      customer: agency.stripeCustomerId,
      limit: 50,
    });

    // Sérialiser les factures
    const serializedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountPaid: invoice.amount_paid / 100, // Convertir de centimes à euros
      amountDue: invoice.amount_due / 100,
      currency: invoice.currency,
      description: invoice.description || invoice.lines.data[0]?.description || "",
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      created: invoice.created * 1000, // Convertir en millisecondes
      dueDate: invoice.due_date ? invoice.due_date * 1000 : null,
      periodStart: invoice.period_start ? invoice.period_start * 1000 : null,
      periodEnd: invoice.period_end ? invoice.period_end * 1000 : null,
      subscriptionId: invoice.subscription,
    }));

    return NextResponse.json({
      success: true,
      invoices: serializedInvoices,
    });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du chargement des factures" },
      { status: 500 }
    );
  }
}
