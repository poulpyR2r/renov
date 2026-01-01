export const dynamic = "force-dynamic";
export const revalidate = 3600;

import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";
import {
  BookOpen,
  Calculator,
  AlertTriangle,
  Leaf,
  Home,
  ArrowRight,
  FileText,
} from "lucide-react";

export const metadata: Metadata = generateSeoMetadata({
  title: "Guides rénovation immobilière | Conseils et astuces",
  description:
    "Guides complets sur la rénovation immobilière : budget, pièges à éviter, aides financières, DPE, rénovation énergétique. Conseils d'experts pour votre projet de rénovation.",
  canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr"}/guides`,
});

const guides = [
  {
    slug: "estimer-budget-renovation",
    title: "Comment estimer le budget d'une maison à rénover",
    description:
      "Découvrez comment calculer le budget nécessaire pour rénover une maison. Guide complet avec exemples de coûts par type de travaux.",
    icon: Calculator,
    category: "Budget",
  },
  {
    slug: "pieges-a-eviter",
    title: "Acheter une maison à rénover : pièges à éviter",
    description:
      "Les erreurs courantes à éviter lors de l'achat d'un bien à rénover. Conseils pratiques pour faire le bon choix.",
    icon: AlertTriangle,
    category: "Conseils",
  },
  {
    slug: "renovation-energetique-aides",
    title: "Rénovation énergétique : aides et DPE",
    description:
      "Toutes les aides financières disponibles pour la rénovation énergétique. MaPrimeRénov, CEE, TVA réduite...",
    icon: Leaf,
    category: "Aides",
  },
  {
    slug: "renover-ou-cle-en-main",
    title: "Maison à rénover ou clé en main ?",
    description:
      "Comparatif entre l'achat d'un bien à rénover et un bien clé en main. Avantages et inconvénients de chaque option.",
    icon: Home,
    category: "Conseils",
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-teal-50/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm mb-6">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Guides & Conseils</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Guides rénovation immobilière
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Conseils d'experts pour réussir votre projet de rénovation
                immobilière. Budget, aides, pièges à éviter...
              </p>
            </div>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-6">
              {guides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Card
                    key={guide.slug}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow group"
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {guide.category}
                            </span>
                          </div>
                          <CardTitle className="text-xl mb-2">
                            {guide.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {guide.description}
                      </p>
                      <Button asChild variant="outline" className="w-full group">
                        <Link href={`/guides/${guide.slug}`}>
                          Lire le guide
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">
                  Prêt à trouver votre bien à rénover ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Utilisez notre moteur de recherche pour découvrir des
                  centaines d'opportunités de rénovation partout en France.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/search">
                      Rechercher des annonces
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/">Retour à l'accueil</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
