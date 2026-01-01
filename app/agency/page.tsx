"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Eye,
  MousePointer,
  CreditCard,
  AlertTriangle,
  Loader2,
  Plus,
  ArrowUpRight,
  Zap,
  Star,
  BarChart3,
  Heart,
  Settings,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useAgencyRole } from "@/hooks/useAgencyRole";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";

interface DashboardData {
  agency: {
    companyName: string;
    status: string;
  };
  subscription: {
    plan: string;
    maxListings: number;
    endDate?: string;
  };
  cpc: {
    balance: number;
    clicksThisMonth: number;
    costPerClick: number;
  };
  stats: {
    totalListings: number;
    activeListings: number;
    sponsoredListings: number;
    totalViews: number;
    totalClicks: number;
    totalFavorites: number;
    viewsThisMonth: number;
    clicksThisMonth: number;
  };
  recentListings: {
    _id: string;
    title: string;
    views: number;
    clicks: number;
    favorites: number;
    isSponsored: boolean;
    createdAt: string;
  }[];
}

export default function AgencyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listingsRemaining, setListingsRemaining] = useState<number | null>(
    null
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const agencyRole = useAgencyRole();

  const canAccessBilling =
    agencyRole === "AGENCY_ADMIN" || agencyRole === "AGENCY_MANAGER";
  const isAdmin = agencyRole === "AGENCY_ADMIN";

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

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

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/agency/dashboard");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        // Mettre à jour le quota depuis les données du dashboard
        const remaining =
          result.data.subscription.maxListings -
          result.data.stats.totalListings;
        setListingsRemaining(remaining);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
    setIsLoading(false);
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "free":
        return "Gratuit";
      case "starter":
        return "Starter";
      case "pro":
        return "Pro";
      case "enterprise":
        return "Enterprise";
      default:
        return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-700";
      case "starter":
        return "bg-blue-100 text-blue-700";
      case "pro":
        return "bg-purple-100 text-purple-700";
      case "enterprise":
        return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // For non-admin users, show tiles instead of detailed dashboard
  if (!isAdmin) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    const availableItems = [
      {
        title: "Mes annonces",
        href: "/agency/listings",
        icon: FileText,
        description: "Gérer vos annonces immobilières",
        color: "bg-blue-500",
      },
    ];

    if (canAccessBilling) {
      availableItems.push(
        {
          title: "Abonnement",
          href: "/agency/subscription",
          icon: CreditCard,
          description: "Gérer votre plan d'abonnement",
          color: "bg-purple-500",
        },
        {
          title: "CPC",
          href: "/agency/cpc",
          icon: Zap,
          description: "Gérer votre budget publicitaire",
          color: "bg-orange-500",
        },
        {
          title: "Facturation",
          href: "/agency/billing",
          icon: Receipt,
          description: "Consulter vos factures",
          color: "bg-emerald-500",
        },
        {
          title: "Statistiques",
          href: "/agency/stats",
          icon: BarChart3,
          description: "Analyser vos performances",
          color: "bg-indigo-500",
        }
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Accédez rapidement aux fonctionnalités de votre agence
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Admin view - keep existing detailed dashboard
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Erreur lors du chargement</p>
      </div>
    );
  }

  // Calculer listingsRemaining depuis les données si disponible, sinon utiliser l'état
  const calculatedListingsRemaining = data
    ? data.subscription.maxListings - data.stats.totalListings
    : listingsRemaining ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Bienvenue, {data.agency.companyName}
          </h2>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité
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

      {/* Abonnement - Section principale (MANAGER + ADMIN seulement) */}
      {canAccessBilling && (
        <>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center">
                    <Star className="w-7 h-7 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">Votre abonnement</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(
                          data.subscription.plan
                        )}`}
                      >
                        {getPlanLabel(data.subscription.plan)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {data.subscription.maxListings} annonces incluses dans
                      votre plan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">
                      {data.stats.totalListings}{" "}
                      <span className="text-lg font-normal text-muted-foreground">
                        / {data.subscription.maxListings}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      annonces publiées
                    </p>
                  </div>
                  <Button variant="default" asChild>
                    <Link href="/agency/subscription">Changer de plan</Link>
                  </Button>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all ${
                      calculatedListingsRemaining <= 0
                        ? "bg-red-500"
                        : calculatedListingsRemaining <= 2
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-orange-400 to-amber-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        (data.stats.totalListings /
                          data.subscription.maxListings) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-sm mt-2 text-muted-foreground">
                  {calculatedListingsRemaining > 0 ? (
                    <>
                      Il vous reste{" "}
                      <span className="font-semibold text-emerald-600">
                        {calculatedListingsRemaining} annonce(s)
                      </span>{" "}
                      à publier
                    </>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Limite atteinte - Passez au plan supérieur pour publier
                      plus
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alerte limite atteinte */}
          {calculatedListingsRemaining <= 0 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-700">
                  Limite d'annonces atteinte
                </p>
                <p className="text-sm text-red-600">
                  Passez à un plan supérieur pour publier plus d'annonces.
                </p>
              </div>
              <Button size="sm" asChild variant="outline">
                <Link href="/agency/subscription">Changer de plan</Link>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Stats cards - Statistiques importantes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.stats.activeListings}
                </p>
                <p className="text-sm text-muted-foreground">
                  Annonces actives
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Vues totales</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              +{data.stats.viewsThisMonth} ce mois
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.totalClicks}</p>
                <p className="text-sm text-muted-foreground">Clics totaux</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              +{data.stats.clicksThisMonth} ce mois
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.stats.totalFavorites}
                </p>
                <p className="text-sm text-muted-foreground">Favoris totaux</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Annonces sauvegardées
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent listings */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Statistiques des annonces
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agency/listings">
                Gérer les annonces
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentListings.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore d'annonces
              </p>
              <Button asChild>
                <Link href="/submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Publier une annonce
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {data.recentListings.map((listing) => (
                <div
                  key={listing._id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {listing.isSponsored && (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Sponsorisée
                      </span>
                    )}
                    <div>
                      <Link
                        href={`/l/${listing._id}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className="flex items-center gap-1 text-purple-600"
                      title="Vues"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{listing.views || 0}</span>
                    </span>
                    <span
                      className="flex items-center gap-1 text-emerald-600"
                      title="Clics"
                    >
                      <MousePointer className="w-4 h-4" />
                      <span className="font-medium">{listing.clicks || 0}</span>
                    </span>
                    <span
                      className="flex items-center gap-1 text-pink-600"
                      title="Favoris"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">
                        {listing.favorites || 0}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section CPC - Plus discrète (MANAGER + ADMIN seulement) */}
      {canAccessBilling && data.stats.sponsoredListings > 0 && (
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">
                    {data.stats.sponsoredListings} annonce(s) sponsorisée(s)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Budget restant: {data.cpc.balance.toFixed(2)}€ • Coût:{" "}
                    {data.cpc.costPerClick.toFixed(2)}€/clic
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/agency/cpc">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gérer le CPC
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
