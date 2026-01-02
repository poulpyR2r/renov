"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Home,
  Menu,
  X,
  Search,
  PlusCircle,
  Shield,
  Sparkles,
  Heart,
  Bell,
  LayoutDashboard,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "next-auth/react";
import { useAgencyRole } from "@/hooks/useAgencyRole";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const agencyRole = useAgencyRole();

  const isAdmin = session?.user?.role === "admin";
  const isAgency = session?.user?.role === "agency";
  const isRegularUser = session?.user && !isAdmin && !isAgency;
  const canAccessBilling =
    agencyRole === "AGENCY_ADMIN" || agencyRole === "AGENCY_MANAGER";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 w-full">
      <div className="container mx-auto px-4 w-full">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
                <Home className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <span className="font-bold text-sm sm:text-base md:text-lg bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent whitespace-nowrap">
              Maisons à Rénover
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/submit"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Soumettre une annonce
            </Link>

            {/* Admin links */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              >
                <Shield className="w-4 h-4" />
                Panneau admin
              </Link>
            )}

            {/* Agency links */}
            {isAgency && (
              <>
                <Link
                  href="/agency"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </Link>
                <Link
                  href="/agency/listings"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Mes annonces
                </Link>
                {canAccessBilling && (
                  <Link
                    href="/agency/billing"
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Facturation
                  </Link>
                )}
              </>
            )}

            {/* Regular user links */}
            {isRegularUser && (
              <>
                <Link
                  href="/favorites"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Heart className="w-4 h-4" />
                  Mes favoris
                </Link>
                <Link
                  href="/alerts"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Bell className="w-4 h-4" />
                  Mes alertes
                </Link>
              </>
            )}

            <div className="w-px h-6 bg-border mx-2" />

            <UserMenu />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <UserMenu />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-3 space-y-1">
            <Link
              href="/search"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100  flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Rechercher des biens
            </Link>

            <Link
              href="/submit"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100  flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Soumettre une annonce
            </Link>

            {/* Admin links */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100  flex items-center justify-center">
                  <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                Panneau admin
              </Link>
            )}

            {/* Agency links */}
            {isAgency && (
              <>
                <Link
                  href="/agency"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100  flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Tableau de bord
                </Link>
                <Link
                  href="/agency/listings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100  flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Mes annonces
                </Link>
                {canAccessBilling && (
                  <Link
                    href="/agency/billing"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100  flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    Facturation & CPC
                  </Link>
                )}
              </>
            )}

            {/* Regular user links */}
            {isRegularUser && (
              <>
                <Link
                  href="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100  flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  Mes favoris
                </Link>
                <Link
                  href="/alerts"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100  flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Mes alertes
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
