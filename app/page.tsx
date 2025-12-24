export const dynamic = "force-dynamic"
export const revalidate = 0

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchForm } from "@/components/search-form"
import { ListingCard } from "@/components/listing-card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getListingModel } from "@/models/Listing"
import { Home, Wrench, TrendingUp } from "lucide-react"

export default async function HomePage() {
  let recentListings: any[] = []

  try {
    const Listing = await getListingModel()
    recentListings = await Listing.find({ status: "active" }).sort({ createdAt: -1 }).limit(6).toArray()
  } catch (error) {
    console.error("Error fetching listings:", error)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold text-balance mb-6">Trouvez votre bien à rénover</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              RenovScout recherche pour vous les meilleures opportunités immobilières à rénover sur toutes les
              plateformes françaises
            </p>

            <SearchForm />
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Home className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-2">Multi-plateformes</h3>
                  <p className="text-sm text-muted-foreground">
                    Recherche simultanée sur LeBonCoin, SeLoger, PAP et plus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-2">Détection intelligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Algorithme qui identifie les biens nécessitant des travaux
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-2">Mises à jour en temps réel</h3>
                  <p className="text-sm text-muted-foreground">Nouvelles annonces ajoutées quotidiennement</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6">Dernières annonces</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentListings.map((listing) => (
                  <ListingCard key={listing._id.toString()} listing={listing} />
                ))}
              </div>

              {recentListings.length > 0 && (
                <div className="text-center mt-8">
                  <Button asChild size="lg">
                    <Link href="/search">Voir toutes les annonces</Link>
                  </Button>
                </div>
              )}

              {recentListings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Aucune annonce disponible pour le moment</p>
                  <Button asChild>
                    <Link href="/admin">Lancer le scraping</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
