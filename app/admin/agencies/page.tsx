"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Agency {
  _id: string;
  companyName: string;
  tradeName?: string;
  legalForm: string;
  siret: string;
  email: string;
  phone: string;
  address: {
    city: string;
    postalCode: string;
  };
  professionalCard: {
    number: string;
    type: string;
    expirationDate: string;
  };
  status: "pending" | "verified" | "rejected" | "suspended";
  listingsCount: number;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [agencyToUpdate, setAgencyToUpdate] = useState<{
    id: string;
    status: "verified" | "rejected" | "suspended";
  } | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, [page, statusFilter]);

  const fetchAgencies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/agencies?${params}`);
      const data = await res.json();

      if (data.success) {
        setAgencies(data.agencies);
        setTotalPages(data.pages);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleStatusChangeClick = (
    agencyId: string,
    newStatus: "verified" | "rejected" | "suspended"
  ) => {
    setAgencyToUpdate({ id: agencyId, status: newStatus });
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!agencyToUpdate) return;

    setActionLoading(agencyToUpdate.id);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyToUpdate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: agencyToUpdate.status }),
      });

      if (res.ok) {
        toast.success(
          agencyToUpdate.status === "verified"
            ? "Agence validée"
            : agencyToUpdate.status === "rejected"
            ? "Demande rejetée"
            : "Agence suspendue"
        );
        fetchAgencies();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
      setAgencyToUpdate(null);
    }
  };

  const getConfirmMessage = () => {
    if (!agencyToUpdate) return "";
    return agencyToUpdate.status === "verified"
      ? "Valider cette agence ?"
      : agencyToUpdate.status === "rejected"
      ? "Rejeter cette demande ?"
      : "Suspendre cette agence ?";
  };

  const getStatusBadge = (status: Agency["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Vérifiée
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Rejetée
          </span>
        );
      case "suspended":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            <Ban className="w-3 h-3" />
            Suspendue
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agences</h2>
          <p className="text-muted-foreground">
            Gérez les agences immobilières partenaires
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <p className="text-sm text-amber-600">En attente</p>
              <p className="text-2xl font-bold text-amber-700">
                {stats.pending}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-600">Vérifiées</p>
              <p className="text-2xl font-bold text-emerald-700">
                {stats.verified}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Rejetées</p>
              <p className="text-2xl font-bold text-red-700">
                {stats.rejected}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="verified">Vérifiées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
                <SelectItem value="suspended">Suspendues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agencies List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : agencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Building2 className="w-12 h-12 mb-4" />
              <p>Aucune agence trouvée</p>
            </div>
          ) : (
            <div className="divide-y">
              {agencies.map((agency) => (
                <div
                  key={agency._id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{agency.companyName}</h3>
                        {getStatusBadge(agency.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {agency.legalForm} • SIRET: {agency.siret}
                        </p>
                        <p>
                          {agency.address.city} ({agency.address.postalCode}) •{" "}
                          {agency.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          Carte Pro: {agency.professionalCard.number} (
                          {agency.professionalCard.type})
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {agency.listingsCount} annonces • Inscrit le{" "}
                        {new Date(agency.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/agencies/${agency._id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Détails
                        </Link>
                      </Button>
                      {agency.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChangeClick(agency._id, "verified")
                            }
                            disabled={actionLoading === agency._id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {actionLoading === agency._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Valider
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleStatusChangeClick(agency._id, "rejected")
                            }
                            disabled={actionLoading === agency._id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      {agency.status === "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChangeClick(agency._id, "suspended")
                          }
                          disabled={actionLoading === agency._id}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspendre
                        </Button>
                      )}
                      {agency.status === "suspended" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChangeClick(agency._id, "verified")
                          }
                          disabled={actionLoading === agency._id}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Réactiver
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleStatusChange}
        title={getConfirmMessage()}
        description="Cette action modifiera le statut de l'agence."
        confirmText="Confirmer"
        cancelText="Annuler"
        variant="default"
      />
    </div>
  );
}
