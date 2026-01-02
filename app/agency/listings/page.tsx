"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Eye,
  MousePointer,
  Loader2,
  Plus,
  Zap,
  ZapOff,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Heart,
  Edit,
  CreditCard,
  Info,
  CheckCircle,
  ArrowUpDown,
  Calendar,
  BadgeEuro,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAgencyRole } from "@/hooks/useAgencyRole";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface Listing {
  _id: string;
  title: string;
  price: number;
  location: {
    city: string;
    postalCode: string;
  };
  images: string[];
  status: string;
  isSponsored: boolean;
  views: number;
  clicks: number;
  favorites: number;
  createdAt: string;
}

export default function AgencyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [cpcInfo, setCpcInfo] = useState<{
    hasEnoughCredits: boolean;
    balance: number;
    costPerClick: number;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [listingToDeactivate, setListingToDeactivate] = useState<string | null>(
    null
  );
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [listingToActivate, setListingToActivate] = useState<string | null>(
    null
  );
  const [listingsRemaining, setListingsRemaining] = useState<number | null>(
    null
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [listingToMarkSold, setListingToMarkSold] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const agencyRole = useAgencyRole();
  const canSponsor =
    agencyRole === "AGENCY_ADMIN" || agencyRole === "AGENCY_MANAGER";
  const canValidate =
    agencyRole === "AGENCY_ADMIN" || agencyRole === "AGENCY_MANAGER";

  useEffect(() => {
    fetchListings();
  }, [page, sortBy, sortOrder, statusFilter]);

  // Récupérer le quota d'annonces disponibles
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/agency/billing");
        const result = await res.json();
        if (result.success && result.data) {
          const { subscription, currentListings } = result.data;
          const remaining = subscription.maxListings - currentListings;
          setListingsRemaining(remaining);
        }
      } catch (error) {
        console.error("Error fetching quota:", error);
      }
    };

    fetchQuota();
  }, []);

  const handleNewListingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (listingsRemaining !== null && listingsRemaining <= 0) {
      setShowUpgradeDialog(true);
    } else {
      router.push("/submit");
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sortBy,
        sortOrder,
        status: statusFilter,
      });

      const res = await fetch(`/api/agency/listings?${params}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.listings);
        setTotalPages(data.pages);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const checkCpcCredits = async (listingId: string) => {
    try {
      const res = await fetch(
        `/api/agency/listings/${listingId}/sponsor/check`
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setCpcInfo({
          hasEnoughCredits: data.hasEnoughCredits,
          balance: data.balance,
          costPerClick: data.costPerClick,
        });
        setSelectedListing(listingId);
        setSponsorDialogOpen(true);
      } else {
        toast.error(data.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      toast.error("Erreur lors de la vérification");
    }
  };

  const handleToggleSponsored = async (
    listingId: string,
    currentStatus: boolean
  ) => {
    // Si on désactive le sponsoring, pas besoin de vérifier les crédits
    if (currentStatus) {
      setActionLoading(listingId);
      try {
        const res = await fetch(`/api/agency/listings/${listingId}/sponsor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSponsored: false }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Sponsoring désactivé");
          fetchListings();
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      }
      setActionLoading(null);
      return;
    }

    // Si on active le sponsoring, vérifier les crédits d'abord
    await checkCpcCredits(listingId);
  };

  const confirmSponsor = async () => {
    if (!selectedListing || !cpcInfo?.hasEnoughCredits) return;

    setActionLoading(selectedListing);
    setSponsorDialogOpen(false);

    try {
      const res = await fetch(
        `/api/agency/listings/${selectedListing}/sponsor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSponsored: true }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Annonce sponsorisée !");
        fetchListings();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
    setActionLoading(null);
    setSelectedListing(null);
    setCpcInfo(null);
  };

  const handleDeleteClick = (listingId: string) => {
    setListingToDelete(listingId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!listingToDelete) return;

    setActionLoading(listingToDelete);
    try {
      const res = await fetch(`/api/agency/listings/${listingToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Annonce supprimée");
        fetchListings();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
      setListingToDelete(null);
    }
  };

  const handleValidate = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const res = await fetch(`/api/agency/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Annonce validée");
        fetchListings();
      } else {
        toast.error(data.error || "Erreur lors de la validation");
      }
    } catch (error) {
      toast.error("Erreur lors de la validation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateClick = (listingId: string) => {
    setListingToDeactivate(listingId);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!listingToDeactivate) return;

    setActionLoading(listingToDeactivate);
    setDeactivateDialogOpen(false);
    try {
      const res = await fetch(`/api/agency/listings/${listingToDeactivate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Annonce désactivée");
        fetchListings();
      } else {
        toast.error(data.error || "Erreur lors de la désactivation");
      }
    } catch (error) {
      toast.error("Erreur lors de la désactivation");
    } finally {
      setActionLoading(null);
      setListingToDeactivate(null);
    }
  };

  const handleActivateClick = (listingId: string) => {
    setListingToActivate(listingId);
    setActivateDialogOpen(true);
  };

  const handleActivate = async () => {
    if (!listingToActivate) return;

    setActionLoading(listingToActivate);
    setActivateDialogOpen(false);
    try {
      const res = await fetch(`/api/agency/listings/${listingToActivate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Annonce activée");
        fetchListings();
      } else {
        toast.error(data.error || "Erreur lors de l'activation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'activation");
    } finally {
      setActionLoading(null);
      setListingToActivate(null);
    }
  };

  const handleMarkSoldClick = (listingId: string) => {
    setListingToMarkSold(listingId);
    setSoldDialogOpen(true);
  };

  const handleMarkSold = async () => {
    if (!listingToMarkSold) return;

    setActionLoading(listingToMarkSold);
    setSoldDialogOpen(false);
    try {
      const res = await fetch(`/api/agency/listings/${listingToMarkSold}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Annonce marquée comme vendue");
        fetchListings();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
      setListingToMarkSold(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
            Active
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
            En attente
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            Inactive
          </span>
        );
      case "sold":
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
            Vendu
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes annonces</h2>
          <p className="text-muted-foreground">
            Gérez vos annonces immobilières
          </p>
        </div>
        <Button
          onClick={handleNewListingClick}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle annonce
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtre par statut */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
              <SelectItem value="sold">Vendues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </span>
              </SelectItem>
              <SelectItem value="price">
                <span className="flex items-center gap-2">
                  <BadgeEuro className="w-4 h-4" />
                  Prix
                </span>
              </SelectItem>
              <SelectItem value="views">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Vues
                </span>
              </SelectItem>
              <SelectItem value="clicks">
                <span className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Clics
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordre */}
        <Select value={sortOrder} onValueChange={(value) => { setSortOrder(value); setPage(1); }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Plus récent</SelectItem>
            <SelectItem value="asc">Plus ancien</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore d'annonces
            </p>
            <Button onClick={handleNewListingClick}>
              <Plus className="w-4 h-4 mr-2" />
              Publier une annonce
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card
              key={listing._id}
              className="border-0 shadow-md overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Image */}
                  <div className="w-32 h-32 sm:w-48 sm:h-32 shrink-0 bg-muted">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold line-clamp-1">
                              {listing.title}
                            </h3>
                            {listing.isSponsored && (
                              <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                CPC
                              </span>
                            )}
                            {getStatusBadge(listing.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {listing.location.city} (
                            {listing.location.postalCode})
                          </p>
                        </div>
                        <p className="font-bold text-lg whitespace-nowrap">
                          {listing.price.toLocaleString("fr-FR")} €
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" title="Vues">
                          <Eye className="w-4 h-4" />
                          {listing.views || 0} vues
                        </span>
                        <span className="flex items-center gap-1" title="Clics">
                          <MousePointer className="w-4 h-4" />
                          {listing.clicks || 0} clics
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Favoris"
                        >
                          <Heart className="w-4 h-4" />
                          {listing.favorites || 0} favoris
                        </span>
                        <span className="text-xs">
                          Créée le{" "}
                          {new Date(listing.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/submit?edit=${listing._id}`}>
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Link>
                        </Button>

                        {canValidate && listing.status === "pending" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleValidate(listing._id)}
                            disabled={actionLoading === listing._id}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {actionLoading === listing._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Valider"
                            )}
                          </Button>
                        )}

                        {canValidate && listing.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkSoldClick(listing._id)}
                              disabled={actionLoading === listing._id}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Vendu
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeactivateClick(listing._id)}
                              disabled={actionLoading === listing._id}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              Désactiver
                            </Button>
                          </>
                        )}

                        {canValidate && listing.status === "inactive" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleActivateClick(listing._id)}
                            disabled={actionLoading === listing._id}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {actionLoading === listing._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Activer"
                            )}
                          </Button>
                        )}

                        {canSponsor && (
                          <Button
                            size="sm"
                            variant={
                              listing.isSponsored ? "outline" : "default"
                            }
                            onClick={() =>
                              handleToggleSponsored(
                                listing._id,
                                listing.isSponsored
                              )
                            }
                            disabled={actionLoading === listing._id}
                            className={
                              listing.isSponsored
                                ? ""
                                : "bg-orange-500 hover:bg-orange-600"
                            }
                          >
                            {actionLoading === listing._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : listing.isSponsored ? (
                              <>
                                <ZapOff className="w-4 h-4 mr-1" />
                                Arrêter CPC
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-1" />
                                Sponsoriser
                              </>
                            )}
                          </Button>
                        )}

                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/l/${listing._id}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(listing._id)}
                          disabled={actionLoading === listing._id}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmation de sponsoring */}
      <Dialog open={sponsorDialogOpen} onOpenChange={setSponsorDialogOpen}>
        <DialogContent>
          {cpcInfo?.hasEnoughCredits ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50">
                  <Zap className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      Sponsoriser cette annonce
                    </h3>
                    <p className="text-sm text-orange-700">
                      Votre annonce sera mise en avant dans les résultats de
                      recherche
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Budget CPC disponible
                    </span>
                    <span className="font-semibold">
                      {cpcInfo.balance.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coût par clic</span>
                    <span className="font-semibold">
                      {cpcInfo.costPerClick.toFixed(2)}€
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <span>
                        Vous serez débité de {cpcInfo.costPerClick.toFixed(2)}€
                        à chaque clic sur votre annonce. Le sponsoring sera
                        automatiquement désactivé si votre budget est épuisé.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSponsorDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmSponsor}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Confirmer le sponsoring
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50">
                  <Info className="w-6 h-6 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-900">
                      Crédits CPC insuffisants
                    </h3>
                    <p className="text-sm text-amber-700">
                      Vous devez recharger votre budget CPC pour sponsoriser une
                      annonce
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Budget CPC actuel
                    </span>
                    <span className="font-semibold">
                      {cpcInfo?.balance.toFixed(2) || "0.00"}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Coût par clic requis
                    </span>
                    <span className="font-semibold">
                      {cpcInfo?.costPerClick.toFixed(2) || "0.50"}€
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSponsorDialogOpen(false)}
                >
                  Fermer
                </Button>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                  <Link href="/agency/cpc">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Recharger mon budget CPC
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer cette annonce"
        description="Cette action est irréversible. L'annonce sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        onConfirm={handleDeactivate}
        title="Désactiver cette annonce"
        description="L'annonce ne sera plus visible sur le site. Vous pourrez la réactiver plus tard."
        confirmText="Désactiver"
        cancelText="Annuler"
        variant="default"
      />

      {/* Activate Confirmation Dialog */}
      <ConfirmDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        onConfirm={handleActivate}
        title="Activer cette annonce"
        description="L'annonce sera à nouveau visible sur le site."
        confirmText="Activer"
        cancelText="Annuler"
        variant="default"
      />

      {/* Mark as Sold Confirmation Dialog */}
      <ConfirmDialog
        open={soldDialogOpen}
        onOpenChange={setSoldDialogOpen}
        onConfirm={handleMarkSold}
        title="Marquer comme vendu"
        description="Cette annonce sera déplacée dans la section 'Vendues'. Elle ne sera plus visible sur le site public."
        confirmText="Confirmer la vente"
        cancelText="Annuler"
        variant="default"
      />

      {/* Dialog d'upgrade d'abonnement */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Attention</h2>
              <p className="text-sm text-muted-foreground">
                Limite d'annonces atteinte
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Vous avez atteint la limite d'annonces de votre plan actuel. Pour
            publier plus d'annonces, veuillez passer à un plan supérieur.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Annuler
            </Button>
            <Button asChild>
              <Link href="/agency/subscription">Upgrade abonnement</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
