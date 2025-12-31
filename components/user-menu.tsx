"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  LogOut,
  Heart,
  User,
  Loader2,
  Shield,
  Bell,
  Building2,
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAgencyRole } from "@/hooks/useAgencyRole";

export function UserMenu() {
  const { data: session, status } = useSession();
  const agencyRole = useAgencyRole();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled className="rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (!session) {
    return (
      <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
        <Link href="/login">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Connexion</span>
        </Link>
      </Button>
    );
  }

  const isAgency = session.user?.role === "agency";
  const isAdmin = session.user?.role === "admin";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full border-2 border-primary/20"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isAgency ? "bg-orange-500/20" : "bg-primary/20"
            }`}
          >
            {isAgency ? (
              <Building2 className="w-4 h-4 text-orange-600" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-down">
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">
                {session.user?.name}
              </p>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary text-primary-foreground font-medium">
                  Admin
                </span>
              )}
              {isAgency && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500 text-white font-medium">
                  Agence
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {session.user?.email}
            </p>
          </div>

          <div className="p-1">
            {/* Admin menu */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                <Shield className="w-4 h-4 text-primary" />
                Panneau admin
              </Link>
            )}

            {/* Agency menu */}
            {isAgency && (
              <>
                <Link
                  href="/agency"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-orange-500" />
                  Tableau de bord
                </Link>
                <Link
                  href="/agency/listings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <FileText className="w-4 h-4 text-orange-500" />
                  Mes annonces
                </Link>
                {(agencyRole === "AGENCY_ADMIN" ||
                  agencyRole === "AGENCY_MANAGER") && (
                  <Link
                    href="/agency/billing"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    Facturation & CPC
                  </Link>
                )}
              </>
            )}

            {/* User menu - only for regular users (not admin or agency) */}
            {!isAgency && !isAdmin && (
              <>
                <Link
                  href="/favorites"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Heart className="w-4 h-4 text-red-500" />
                  Mes favoris
                </Link>

                <Link
                  href="/alerts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  Mes alertes
                </Link>

                <Link
                  href="/profile/messages"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Messagerie
                </Link>

                <Link
                  href="/profile/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Settings className="w-4 h-4 text-primary" />
                  Paramètres
                </Link>
              </>
            )}

            <div className="my-1 border-t" />

            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
