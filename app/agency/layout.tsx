"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  TrendingUp,
  Zap,
  Receipt,
  Users,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type AgencyRole = "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER";

const navItems = [
  {
    title: "Tableau de bord",
    href: "/agency",
    icon: LayoutDashboard,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"] as AgencyRole[],
  },
  {
    title: "Mes annonces",
    href: "/agency/listings",
    icon: FileText,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"] as AgencyRole[],
  },
  {
    title: "Abonnement",
    href: "/agency/subscription",
    icon: CreditCard,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER"] as AgencyRole[],
  },
  {
    title: "CPC",
    href: "/agency/cpc",
    icon: Zap,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER"] as AgencyRole[],
  },
  {
    title: "Facturation",
    href: "/agency/billing",
    icon: Receipt,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER"] as AgencyRole[],
  },
  {
    title: "Statistiques",
    href: "/agency/stats",
    icon: TrendingUp,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER"] as AgencyRole[],
  },
  {
    title: "Paramètres",
    href: "/agency/settings",
    icon: Settings,
    roles: ["AGENCY_ADMIN"] as AgencyRole[],
  },
  {
    title: "Gestion agence",
    href: "/agency/members",
    icon: Users,
    roles: ["AGENCY_ADMIN"] as AgencyRole[],
  },
  {
    title: "Support / Retours",
    href: "/agency/feedback",
    icon: MessageSquare,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"] as AgencyRole[],
  },
  {
    title: "Messagerie",
    href: "/agency/messages",
    icon: MessageSquare,
    roles: ["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"] as AgencyRole[],
  },
];

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<AgencyRole | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [listingsRemaining, setListingsRemaining] = useState<number | null>(
    null
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.role !== "agency") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Fetch user's agency role
  useEffect(() => {
    if (status === "loading" || !session?.user) return;

    const fetchRole = async () => {
      try {
        // First get agency info to get agencyId
        const agencyRes = await fetch("/api/agency/me");
        const agencyData = await agencyRes.json();

        if (agencyData.success && agencyData.agency?._id) {
          setAgencyId(agencyData.agency._id);

          // Then get role
          const roleRes = await fetch(
            `/api/agency/role?agencyId=${agencyData.agency._id}`
          );
          const roleData = await roleRes.json();

          if (roleData.success && roleData.role) {
            setUserRole(roleData.role);
          }
        }
      } catch (error) {
        console.error("Error fetching agency role:", error);
      }
    };

    fetchRole();
  }, [session, status]);

  // Récupérer le quota d'annonces disponibles
  useEffect(() => {
    if (status === "loading" || !session?.user) return;

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
  }, [session, status]);

  const handleNewListingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (listingsRemaining !== null && listingsRemaining <= 0) {
      setShowUpgradeDialog(true);
    } else {
      router.push("/submit");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.user?.role !== "agency") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès réservé aux agences</h1>
          <p className="text-muted-foreground mb-4">
            Cet espace est réservé aux agences partenaires.
          </p>
          <Link
            href="/"
            className="text-primary hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Check if agency is verified
  if (session.user.agencyStatus !== "verified") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Compte en attente</h1>
          <p className="text-muted-foreground mb-4">
            Votre compte agence est en cours de vérification. Vous aurez accès à
            cet espace une fois validé.
          </p>
          <Link
            href="/"
            className="text-primary hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/agency" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Espace Agence</span>
          </Link>
        </div>

        {/* New listing button */}
        <div className="p-4">
          <button
            onClick={handleNewListingClick}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nouvelle annonce
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1">
          {navItems
            .filter((item) => {
              // Show all items if role not loaded yet (to avoid flickering)
              if (!userRole) return true;
              return item.roles.includes(userRole);
            })
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/agency" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              );
            })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {/* Header */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {navItems.find(
                (item) =>
                  pathname === item.href ||
                  (item.href !== "/agency" && pathname.startsWith(item.href))
              )?.title || "Tableau de bord"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-600 font-medium">
              Agence
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>

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
