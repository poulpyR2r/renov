"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Search,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Euro,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Listing {
  _id: string;
  title: string;
  price?: number;
  surface?: number;
  rooms?: number;
  propertyType: string;
  status: string;
  location?: {
    city?: string;
    department?: string;
  };
  images?: string[];
  renovationScore?: number;
  sourceId?: string;
  sourceName?: string;
  createdAt: string;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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

  useEffect(() => {
    fetchListings();
  }, [page, status]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/listings?${params}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.listings);
        setTotalPages(data.pages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Erreur lors du chargement des annonces");
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setListings((prev) =>
          prev.map((l) =>
            l._id === listingId ? { ...l, status: newStatus } : l
          )
        );
        toast.success(`Statut mis à jour: ${newStatus}`);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteClick = (listingId: string) => {
    setListingToDelete(listingId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!listingToDelete) return;

    try {
      const res = await fetch(`/api/admin/listings/${listingToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setListings((prev) => prev.filter((l) => l._id !== listingToDelete));
        setTotal((prev) => prev - 1);
        toast.success("Annonce supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeactivateClick = (listingId: string) => {
    setListingToDeactivate(listingId);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!listingToDeactivate) return;

    try {
      const res = await fetch(`/api/admin/listings/${listingToDeactivate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });

      if (res.ok) {
        setListings((prev) =>
          prev.map((l) =>
            l._id === listingToDeactivate ? { ...l, status: "inactive" } : l
          )
        );
        toast.success("Annonce désactivée");
        setDeactivateDialogOpen(false);
        setListingToDeactivate(null);
      } else {
        toast.error("Erreur lors de la désactivation");
      }
    } catch (error) {
      toast.error("Erreur lors de la désactivation");
    }
  };

  const handleActivateClick = (listingId: string) => {
    setListingToActivate(listingId);
    setActivateDialogOpen(true);
  };

  const handleActivate = async () => {
    if (!listingToActivate) return;

    try {
      const res = await fetch(`/api/admin/listings/${listingToActivate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (res.ok) {
        setListings((prev) =>
          prev.map((l) =>
            l._id === listingToActivate ? { ...l, status: "active" } : l
          )
        );
        toast.success("Annonce activée");
        setActivateDialogOpen(false);
        setListingToActivate(null);
      } else {
        toast.error("Erreur lors de l'activation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'activation");
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Annonces</h2>
          <p className="text-muted-foreground">
            {total} annonce{total > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre ou ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="inactive">Inactives</SelectItem>
                <SelectItem value="sold">Vendues</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      {/* Listings List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Home className="w-12 h-12 mb-4" />
              <p>Aucune annonce trouvée</p>
            </div>
          ) : (
            <div className="divide-y">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {listing.location?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.location.city}
                        </span>
                      )}
                      {listing.price && (
                        <span className="flex items-center gap-1">
                          <Euro className="w-3.5 h-3.5" />
                          {formatPrice(listing.price)}
                        </span>
                      )}
                      {listing.surface && (
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5" />
                          {listing.surface} m²
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {listing.renovationScore !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          Score: {listing.renovationScore}
                        </span>
                      )}
                      {listing.sourceName && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {listing.sourceName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={listing.status}
                      onValueChange={(value) =>
                        handleStatusChange(listing._id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="sold">Vendue</SelectItem>
                      </SelectContent>
                    </Select>

                    {listing.status === "pending" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(listing._id, "active")
                        }
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        Valider
                      </Button>
                    )}

                    {listing.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateClick(listing._id)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        Désactiver
                      </Button>
                    )}

                    {listing.status === "inactive" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleActivateClick(listing._id)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        Activer
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link href={`/l/${listing._id}`} target="_blank">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(listing._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
    </div>
  );
}
