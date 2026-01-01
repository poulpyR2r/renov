"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Loader2,
  Download,
  ExternalLink,
  CreditCard,
  Euro,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface BillingData {
  subscription: {
    plan: string;
    maxListings: number;
    startDate: string;
    endDate?: string;
    autoRenew: boolean;
  };
  cpc: {
    balance: number;
    totalSpent: number;
    costPerClick: number;
    clicksThisMonth: number;
    lastRechargeAt?: string;
  };
}

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  currency: string;
  creditsAdded?: number;
  description: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  description: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  created: number;
  dueDate: number | null;
  periodStart: number | null;
  periodEnd: number | null;
  subscriptionId: string | null;
}

export default function AgencyBillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch billing data
      const billingRes = await fetch("/api/agency/billing");
      const billingResult = await billingRes.json();
      if (billingResult.success) {
        setBillingData({
          subscription: billingResult.data.subscription,
          cpc: billingResult.data.cpc,
        });
      }

      // Fetch transactions
      const transactionsRes = await fetch("/api/agency/billing/transactions");
      const transactionsResult = await transactionsRes.json();
      if (transactionsResult.success) {
        setTransactions(transactionsResult.transactions);
      }

      // Fetch invoices
      const invoicesRes = await fetch("/api/agency/billing/invoices");
      const invoicesResult = await invoicesRes.json();
      if (invoicesResult.success) {
        setInvoices(invoicesResult.invoices);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === "string" ? new Date(dateString) : new Date(dateString);
    return format(date, "dd MMM yyyy à HH:mm");
  };

  const getTransactionIcon = (type: "credit" | "debit") => {
    return type === "credit" ? (
      <TrendingUp className="w-5 h-5 text-emerald-500" />
    ) : (
      <CreditCard className="w-5 h-5 text-orange-500" />
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Payée", className: "bg-emerald-100 text-emerald-700" },
      open: { label: "En attente", className: "bg-amber-100 text-amber-700" },
      draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
      uncollectible: { label: "Impayée", className: "bg-red-100 text-red-700" },
      void: { label: "Annulée", className: "bg-gray-100 text-gray-700" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Erreur lors du chargement</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Facturation</h2>
        <p className="text-muted-foreground">
          Consultez vos factures et l'historique de vos transactions
        </p>
      </div>

      {/* Résumé */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Plan actuel
                </p>
                <p className="text-2xl font-bold capitalize">
                  {billingData.subscription.plan}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total dépensé (CPC)
                </p>
                <p className="text-2xl font-bold">
                  {billingData.cpc.totalSpent.toFixed(2)}€
                </p>
              </div>
              <Euro className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Solde CPC actuel
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {billingData.cpc.balance.toFixed(2)}€
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factures (Abonnements) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Factures d'abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture disponible</p>
              <p className="text-sm mt-2">
                Vos factures d'abonnement apparaîtront ici une fois que vous vous serez abonné à un plan payant.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">
                        Facture #{invoice.number || invoice.id.substring(3, 13)}
                      </h4>
                      {getInvoiceStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {invoice.description || "Abonnement"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(invoice.created)}
                      </span>
                      {invoice.periodStart && invoice.periodEnd && (
                        <span>
                          Période : {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {invoice.amountPaid.toFixed(2)}€
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.currency.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Voir
                          </a>
                        </Button>
                      )}
                      {invoice.invoicePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des transactions CPC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Historique des transactions CPC
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune transaction</p>
              <p className="text-sm mt-2">
                Vos recharges CPC et débits apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{transaction.description}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "credit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {transaction.type === "credit" ? "Crédit" : "Débit"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === "credit"
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {transaction.amount.toFixed(2)}€
                    </p>
                    {transaction.creditsAdded && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.creditsAdded.toFixed(2)} crédits
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
