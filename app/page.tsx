export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchForm } from "@/components/search-form";
import { ListingCard } from "@/components/listing-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getListingModel } from "@/models/Listing";
import { getHomeMetadata } from "@/lib/seo";
import {
  Home,
  Wrench,
  TrendingUp,
  Search,
  Zap,
  Shield,
  MapPin,
  ArrowRight,
  Sparkles,
  Building2,
  Hammer,
} from "lucide-react";

export const metadata: Metadata = getHomeMetadata();

export default async function HomePage() {
  let recentListings: any[] = [];

  try {
    const Listing = await getListingModel();
    const listings = await Listing.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    // Sérialiser les objets MongoDB pour les passer aux Client Components
    recentListings = listings.map((listing: any) => ({
      ...listing,
      _id: listing._id.toString(),
      createdAt: listing.createdAt?.toISOString?.() || listing.createdAt,
      updatedAt: listing.updatedAt?.toISOString?.() || listing.updatedAt,
      publishedAt: listing.publishedAt?.toISOString?.() || listing.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching listings:", error);
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Background with gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50" />
          <div className="absolute inset-0 pattern-dots opacity-60" />

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-[10%] w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl rotate-12 animate-float blur-sm" />
          <div className="absolute top-40 right-[15%] w-16 h-16 bg-gradient-to-br from-accent/30 to-accent/10 rounded-full animate-float-reverse" />
          <div className="absolute bottom-32 left-[20%] w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl -rotate-12 animate-float animation-delay-300" />
          <div className="absolute bottom-20 right-[10%] w-14 h-14 bg-gradient-to-br from-accent/25 to-transparent rounded-xl rotate-45 animate-float-reverse animation-delay-500" />
          <div className="absolute top-1/3 left-[5%] w-8 h-8 bg-primary/40 rounded-lg rotate-45 animate-float animation-delay-200" />
          <div className="absolute top-1/2 right-[8%] w-12 h-12 bg-accent/30 rounded-full animate-float animation-delay-400" />

          {/* Main content */}
          <div className="relative z-10 container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-down">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Agrégateur intelligent d'annonces immobilières
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
                Trouvez votre{" "}
                <span className="gradient-text">maison à rénover</span>
                <br />
                <span className="text-4xl md:text-5xl text-muted-foreground font-medium">
                  en France
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
                Maisons à Rénover agrège les meilleures opportunités
                immobilières à rénover depuis toutes les plateformes françaises.
                Gagnez du temps, trouvez la perle rare.
              </p>

              {/* SEO Text Section - Visible pour les moteurs de recherche, masqué visuellement */}
              <div className="sr-only">
                <div className="prose prose-sm md:prose-base max-w-none">
                  <p>
                    <strong>Maisons à Rénover</strong> est votre moteur de
                    recherche spécialisé pour trouver des{" "}
                    <strong>maisons à rénover</strong> et des{" "}
                    <strong>biens immobiliers avec travaux</strong> en France.
                    Nous centralisons les annonces provenant des principales
                    plateformes immobilières (LeBonCoin, SeLoger, PAP, etc.)
                    pour vous faire gagner un temps précieux dans votre
                    recherche. Que vous cherchiez une{" "}
                    <strong>maison ancienne à rénover</strong>, un{" "}
                    <strong>appartement avec travaux</strong>, ou un{" "}
                    <strong>bien pour investissement</strong>, nos filtres
                    avancés vous aident à identifier rapidement les opportunités
                    correspondant à vos critères. Découvrez des biens avec un
                    fort potentiel de rénovation et réalisez votre projet
                    immobilier en toute sérénité.
                  </p>
                </div>
              </div>

              {/* Search form with enhanced styling */}
              <div className="animate-fade-in-up animation-delay-300 mb-8">
                <div className="max-w-2xl mx-auto p-2 rounded-2xl glass shadow-xl">
                  <SearchForm />
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 animate-fade-in-up animation-delay-400">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">500+</p>
                    <p className="text-xs text-muted-foreground">Annonces</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">95</p>
                    <p className="text-xs text-muted-foreground">
                      Départements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">24h</p>
                    <p className="text-xs text-muted-foreground">Mise à jour</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 pattern-grid opacity-30" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Pourquoi Maisons à Rénover ?
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                La recherche immobilière{" "}
                <span className="gradient-text">réinventée</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Fini les heures passées à chercher sur plusieurs sites. Nous
                centralisons tout pour vous.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-8 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Recherche Unifiée</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Toutes les plateformes en un seul endroit. Plus besoin de
                    jongler entre LeBonCoin, SeLoger, PAP...
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-8 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-6 shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform duration-300">
                    <Hammer className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Filtres Rénovation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Des filtres spécialement conçus pour trouver les biens à
                    rénover : état, travaux estimés, potentiel...
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-8 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Alertes Temps Réel</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Soyez notifié dès qu'une nouvelle opportunité correspond à
                    vos critères. Ne ratez plus aucune affaire.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Recent Listings Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  Dernières trouvailles
                </span>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Annonces récentes
                </h2>
              </div>
              {recentListings.length > 0 && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 md:mt-0 group"
                >
                  <Link href="/search" className="flex items-center gap-2">
                    Voir toutes les annonces
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </div>

            {recentListings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentListings.map((listing, index) => (
                  <div
                    key={listing._id.toString()}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <Home className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Aucune annonce disponible
                  </h3>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
          <div className="absolute inset-0 pattern-dots opacity-20" />

          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

          <div className="container mx-auto max-w-4xl relative text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à trouver votre prochain projet ?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Commencez votre recherche dès maintenant et découvrez des
              centaines d'opportunités de rénovation partout en France.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <Link href="/search">
                  <Search className="w-5 h-5 mr-2" />
                  Commencer la recherche
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/submit">
                  <Wrench className="w-5 h-5 mr-2" />
                  Soumettre une annonce
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
