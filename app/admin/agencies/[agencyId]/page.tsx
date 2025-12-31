"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  Shield,
  Ban,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Calendar,
  Building,
  Hash,
  ExternalLink,
  User,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Agency {
  _id: string;
  companyName: string;
  tradeName?: string;
  legalForm: string;
  siret: string;
  siren?: string;
  vatNumber?: string;
  rcs?: string;
  capital?: number;
  professionalCard: {
    number: string;
    type: "T" | "G" | "TG";
    prefecture: string;
    expirationDate: string;
    guaranteeProvider: string;
    guaranteeAmount: number;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    coverage: number;
    expirationDate: string;
  };
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  description?: string;
  status: "pending" | "verified" | "rejected" | "suspended";
  verifiedAt?: string;
  rejectionReason?: string;
  listingsCount: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

export default function AgencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = params.agencyId as string;

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchAgency();
  }, [agencyId]);

  const fetchAgency = async () => {
    try {
      const res = await fetch(`/api/admin/agencies/${agencyId}`);
      const data = await res.json();
      if (data.success) {
        setAgency(data.agency);
      } else {
        toast.error("Agence non trouvée");
        router.push("/admin/agencies");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (
    newStatus: "verified" | "rejected" | "suspended"
  ) => {
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Veuillez indiquer un motif de rejet");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason:
            newStatus === "rejected" ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        toast.success(
          newStatus === "verified"
            ? "Agence validée avec succès"
            : newStatus === "rejected"
            ? "Demande rejetée"
            : "Agence suspendue"
        );
        fetchAgency();
        setShowRejectForm(false);
        setRejectionReason("");
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: Agency["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Vérifiée
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            En attente de vérification
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            Rejetée
          </span>
        );
      case "suspended":
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            <Ban className="w-4 h-4" />
            Suspendue
          </span>
        );
    }
  };

  const getCardTypeLabel = (type: string) => {
    switch (type) {
      case "T":
        return "Transaction";
      case "G":
        return "Gestion";
      case "TG":
        return "Transaction + Gestion";
      default:
        return type;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fr-FR") + " €";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agency) return null;

  const isCardExpired =
    new Date(agency.professionalCard.expirationDate) < new Date();
  const isCardExpiringSoon =
    new Date(agency.professionalCard.expirationDate) <
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/agencies">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{agency.companyName}</h2>
            {agency.tradeName && (
              <p className="text-muted-foreground">{agency.tradeName}</p>
            )}
            <div className="mt-2">{getStatusBadge(agency.status)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {agency.status === "pending" && (
            <>
              <Button
                onClick={() => handleStatusChange("verified")}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider l'agence
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          {agency.status === "verified" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("suspended")}
              disabled={actionLoading}
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspendre
            </Button>
          )}
          {agency.status === "suspended" && (
            <Button
              onClick={() => handleStatusChange("verified")}
              disabled={actionLoading}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Réactiver
            </Button>
          )}
        </div>
      </div>

      {/* Rejection Form */}
      {showRejectForm && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 text-red-700 dark:text-red-400">
              Motif du rejet
            </h3>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("rejected")}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                Confirmer le rejet
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected reason display */}
      {agency.status === "rejected" && agency.rejectionReason && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Motif du rejet
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {agency.rejectionReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Informations entreprise */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Informations entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Raison sociale</p>
                <p className="font-medium">{agency.companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Forme juridique</p>
                <p className="font-medium">{agency.legalForm}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SIRET</p>
                <p className="font-medium font-mono">{agency.siret}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SIREN</p>
                <p className="font-medium font-mono">
                  {agency.siret.slice(0, 9)}
                </p>
              </div>
              {agency.capital && (
                <div>
                  <p className="text-muted-foreground">Capital social</p>
                  <p className="font-medium">
                    {formatCurrency(agency.capital)}
                  </p>
                </div>
              )}
              {agency.rcs && (
                <div>
                  <p className="text-muted-foreground">RCS</p>
                  <p className="font-medium">{agency.rcs}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-2">
                Vérifications externes
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://www.societe.com/cgi-bin/search?champs=${agency.siret.slice(
                      0,
                      9
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Societe.com
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://www.pappers.fr/entreprise/${agency.siret.slice(
                      0,
                      9
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Pappers
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${agency.siret.slice(
                      0,
                      9
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Annuaire Entreprises
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.cci.fr/ressources/formalites-en-ligne/fichier-des-professionnels-de-limmobilier/recherche-dune-carte-dagent-immobilier"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Vérifier carte CCI
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte professionnelle */}
        <Card
          className={`border-0 shadow-md ${
            isCardExpired
              ? "ring-2 ring-red-500"
              : isCardExpiringSoon
              ? "ring-2 ring-amber-500"
              : ""
          }`}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Carte professionnelle
              {isCardExpired && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  EXPIRÉE
                </span>
              )}
              {!isCardExpired && isCardExpiringSoon && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Expire bientôt
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Numéro de carte</p>
                <p className="font-medium font-mono">
                  {agency.professionalCard.number}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">
                  {getCardTypeLabel(agency.professionalCard.type)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Préfecture</p>
                <p className="font-medium">
                  {agency.professionalCard.prefecture}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiration</p>
                <p
                  className={`font-medium ${
                    isCardExpired
                      ? "text-red-600"
                      : isCardExpiringSoon
                      ? "text-amber-600"
                      : ""
                  }`}
                >
                  {formatDate(agency.professionalCard.expirationDate)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-2">
                Garantie financière
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Organisme</p>
                  <p className="font-medium">
                    {agency.professionalCard.guaranteeProvider}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montant</p>
                  <p className="font-medium">
                    {formatCurrency(agency.professionalCard.guaranteeAmount)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assurance */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Assurance RCP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agency.insurance.provider ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Assureur</p>
                  <p className="font-medium">{agency.insurance.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">N° de police</p>
                  <p className="font-medium font-mono">
                    {agency.insurance.policyNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Couverture</p>
                  <p className="font-medium">
                    {agency.insurance.coverage
                      ? formatCurrency(agency.insurance.coverage)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiration</p>
                  <p className="font-medium">
                    {agency.insurance.expirationDate
                      ? formatDate(agency.insurance.expirationDate)
                      : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Aucune information d'assurance fournie
              </p>
            )}
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Adresse</p>
              <p className="font-medium">
                {agency.address.street}
                <br />
                {agency.address.postalCode} {agency.address.city}
                <br />
                {agency.address.country}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
              <div>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Téléphone
                </p>
                <p className="font-medium">
                  <a
                    href={`tel:${agency.phone}`}
                    className="hover:text-primary"
                  >
                    {agency.phone}
                  </a>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </p>
                <p className="font-medium">
                  <a
                    href={`mailto:${agency.email}`}
                    className="hover:text-primary"
                  >
                    {agency.email}
                  </a>
                </p>
              </div>
              {agency.website && (
                <div className="col-span-2">
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Site web
                  </p>
                  <p className="font-medium">
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {agency.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats & Dates */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-muted-foreground">Annonces publiées</p>
              <p className="text-2xl font-bold">{agency.listingsCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vues totales</p>
              <p className="text-2xl font-bold">{agency.totalViews}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Inscription</p>
              <p className="font-medium">{formatDate(agency.createdAt)}</p>
            </div>
            {agency.verifiedAt && (
              <div>
                <p className="text-muted-foreground">Validé le</p>
                <p className="font-medium">{formatDate(agency.verifiedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Dernière mise à jour</p>
              <p className="font-medium">{formatDate(agency.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
