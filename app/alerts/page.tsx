"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  BellOff,
  Plus,
  Loader2,
  LogIn,
  Trash2,
  Pencil,
  Play,
  Pause,
  Mail,
  Clock,
  MapPin,
  Home,
  Euro,
  Maximize2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Alert {
  _id: string;
  name: string;
  filters: {
    query?: string;
    propertyTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
    minSurface?: number;
    maxSurface?: number;
    cities?: string[];
    departments?: string[];
    minRenovationScore?: number;
  };
  frequency: "instant" | "daily" | "weekly";
  isActive: boolean;
  isPaused: boolean;
  emailEnabled: boolean;
  matchCount: number;
  lastSentAt?: string;
  createdAt: string;
}

function formatFrequency(frequency: string): string {
  switch (frequency) {
    case "instant":
      return "Instantanée";
    case "daily":
      return "Quotidienne";
    case "weekly":
      return "Hebdomadaire";
    default:
      return frequency;
  }
}

function formatPrice(price?: number): string {
  if (!price) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getPropertyTypeLabel(type: string): string {
  switch (type) {
    case "house":
      return "Maison";
    case "apartment":
      return "Appartement";
    case "building":
      return "Immeuble";
    default:
      return type;
  }
}

function AlertCard({
  alert,
  onTogglePause,
  onDelete,
}: {
  alert: Alert;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  // Charger automatiquement le nombre d'annonces disponibles
  useEffect(() => {
    const fetchPreviewCount = async () => {
      try {
        const res = await fetch(`/api/alerts/${alert._id}/preview`);
        const data = await res.json();
        if (data.success) {
          setPreviewCount(data.totalCount);
        }
      } catch (error) {
        console.error("Error fetching preview count:", error);
      }
    };
    fetchPreviewCount();
  }, [alert._id]);

  const handleTestSend = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(`/api/alerts/${alert._id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Erreur lors de l'envoi de test");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de test");
    }
    setIsTesting(false);
  };

  const handleTogglePause = async () => {
    setIsToggling(true);
    await onTogglePause(alert._id);
    setIsToggling(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(alert._id);
    setDeleteDialogOpen(false);
  };

  const filterTags = [];

  if (alert.filters.propertyTypes?.length) {
    filterTags.push({
      icon: Home,
      label: alert.filters.propertyTypes.map(getPropertyTypeLabel).join(", "),
    });
  }

  if (alert.filters.minPrice || alert.filters.maxPrice) {
    const priceLabel =
      alert.filters.minPrice && alert.filters.maxPrice
        ? `${formatPrice(alert.filters.minPrice)} - ${formatPrice(
            alert.filters.maxPrice
          )}`
        : alert.filters.minPrice
        ? `Min ${formatPrice(alert.filters.minPrice)}`
        : `Max ${formatPrice(alert.filters.maxPrice)}`;
    filterTags.push({ icon: Euro, label: priceLabel });
  }

  if (alert.filters.minSurface || alert.filters.maxSurface) {
    const surfaceLabel =
      alert.filters.minSurface && alert.filters.maxSurface
        ? `${alert.filters.minSurface} - ${alert.filters.maxSurface} m²`
        : alert.filters.minSurface
        ? `Min ${alert.filters.minSurface} m²`
        : `Max ${alert.filters.maxSurface} m²`;
    filterTags.push({ icon: Maximize2, label: surfaceLabel });
  }

  if (alert.filters.cities?.length) {
    filterTags.push({
      icon: MapPin,
      label:
        alert.filters.cities.length > 2
          ? `${alert.filters.cities.slice(0, 2).join(", ")} +${
              alert.filters.cities.length - 2
            }`
          : alert.filters.cities.join(", "),
    });
  }

  if (alert.filters.departments?.length) {
    filterTags.push({
      icon: MapPin,
      label: `Dép. ${alert.filters.departments.join(", ")}`,
    });
  }

  if (alert.filters.minRenovationScore) {
    filterTags.push({
      icon: Sparkles,
      label: `Score ≥ ${alert.filters.minRenovationScore}`,
    });
  }

  if (alert.filters.query) {
    filterTags.push({
      icon: Search,
      label: `"${alert.filters.query}"`,
    });
  }

  return (
    <Card
      className={`border-0 shadow-lg overflow-hidden transition-all ${
        alert.isPaused ? "opacity-60" : ""
      }`}
    >
      <div
        className={`h-1 ${
          alert.isPaused
            ? "bg-muted"
            : alert.isActive
            ? "bg-gradient-to-r from-primary to-primary/80"
            : "bg-muted"
        }`}
      />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{alert.name}</h3>
              {alert.isPaused ? (
                <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  En pause
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatFrequency(alert.frequency)}
              </span>
              {alert.emailEnabled && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {previewCount !== null ? (
                  <span className="text-primary font-medium">
                    {previewCount} disponibles
                  </span>
                ) : (
                  <span>{alert.matchCount} envoyés</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:text-primary"
              onClick={handleTestSend}
              disabled={isTesting}
              title="Envoyer un email de test"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleTogglePause}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : alert.isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/alerts/${alert._id}/edit`}>
                <Pencil className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filter Tags */}
        {filterTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filterTags.map((tag, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-sm"
              >
                <tag.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Aucun filtre configuré - toutes les annonces
          </p>
        )}

        {/* Last sent */}
        {alert.lastSentAt && (
          <p className="text-xs text-muted-foreground mt-3">
            Dernier envoi :{" "}
            {new Date(alert.lastSentAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardContent>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer cette alerte"
        description="Êtes-vous sûr de vouloir supprimer cette alerte ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={isDeleting}
      />
    </Card>
  );
}

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxAlerts, setMaxAlerts] = useState(10);

  useEffect(() => {
    if (session?.user) {
      fetchAlerts();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
      setMaxAlerts(data.maxAlerts || 10);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePause = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePause" }),
      });

      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a._id === alertId ? { ...a, isPaused: !a.isPaused } : a
          )
        );
        toast.success("Alerte mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        toast.success("Alerte supprimée");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Mes alertes</h1>
              <p className="text-muted-foreground mb-6">
                Connectez-vous pour créer des alertes et être notifié des
                nouvelles annonces correspondant à vos critères.
              </p>
              <Button
                onClick={() => signIn("google")}
                size="lg"
                className="gap-2"
              >
                <LogIn className="w-5 h-5" />
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary" />
                Mes alertes
              </h1>
              <p className="text-muted-foreground">
                {alerts.length} alerte{alerts.length !== 1 ? "s" : ""} sur{" "}
                {maxAlerts} maximum
              </p>
            </div>
            {alerts.length < maxAlerts && (
              <Button asChild className="gap-2">
                <Link href="/alerts/new">
                  <Plus className="w-4 h-4" />
                  Nouvelle alerte
                </Link>
              </Button>
            )}
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BellOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Aucune alerte</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Créez votre première alerte pour être notifié dès qu'une
                  nouvelle annonce correspond à vos critères de recherche.
                </p>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/alerts/new">
                    <Plus className="w-5 h-5" />
                    Créer une alerte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  onTogglePause={handleTogglePause}
                  onDelete={handleDelete}
                />
              ))}

              {alerts.length < maxAlerts && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-14 border-dashed gap-2"
                >
                  <Link href="/alerts/new">
                    <Plus className="w-5 h-5" />
                    Ajouter une alerte
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-4 rounded-xl bg-muted/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Comment fonctionnent les alertes ?
              </p>
              <ul className="space-y-1">
                <li>
                  • <strong>Instantanée</strong> : notification dès qu'une
                  nouvelle annonce correspond
                </li>
                <li>
                  • <strong>Quotidienne</strong> : résumé envoyé chaque jour à
                  9h
                </li>
                <li>
                  • <strong>Hebdomadaire</strong> : résumé envoyé chaque lundi à
                  9h
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
