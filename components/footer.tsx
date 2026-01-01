"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Heart } from "lucide-react";
import { CookiePreferences } from "./cookie-preferences";

export function Footer() {
  const [cookiePreferencesOpen, setCookiePreferencesOpen] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t bg-muted/30">
      {/* Decorative background */}
      <div className="absolute inset-0 pattern-grid opacity-20" />

      <div className="container mx-auto max-w-6xl relative px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-3 font-bold text-xl mb-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="gradient-text">Maisons à Rénover</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Votre moteur de recherche intelligent pour dénicher les meilleures
              opportunités immobilières à rénover en France.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/search"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Rechercher
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Soumettre une annonce
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Légal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/legal/cgu"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/mentions-legales"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/politique-confidentialite"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/politique-cookies"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Cookies
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setCookiePreferencesOpen(true)}
                  className="hover:text-primary transition-colors flex items-center gap-2 group text-left w-full"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Gestion des cookies
                </button>
              </li>
              <li>
                <Link
                  href="/legal/cgv"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  CGV
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              À propos
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Maisons à Rénover agrège les annonces de biens à rénover depuis les
              principales plateformes immobilières françaises.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Maisons à Rénover. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Modale de gestion des cookies */}
      <CookiePreferences
        open={cookiePreferencesOpen}
        onOpenChange={setCookiePreferencesOpen}
      />
    </footer>
  );
}
