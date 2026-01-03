import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { NewsletterPopups } from "@/components/newsletter-popups";
import { CookieBanner } from "@/components/cookie-banner";
import { ConditionalAnalytics } from "@/components/conditional-analytics";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maisons à Rénover - Trouvez votre bien à rénover",
  description:
    "Moteur de recherche d'annonces immobilières à rénover en France",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
            <NewsletterPopups />
            <CookieBanner />
            <ConditionalAnalytics />
          </SessionProvider>
        </ThemeProvider>
        {/* Analytics Vercel - Note: Vercel Analytics est chargé côté serveur, 
            pour un contrôle complet du consentement, envisager d'utiliser un composant client-side wrapper */}
        <Analytics />
      </body>
    </html>
  );
}
