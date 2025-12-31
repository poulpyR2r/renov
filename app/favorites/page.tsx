"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Loader2, Search, LogIn, Home, MapPin, Maximize2 } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { FavoriteButton } from "@/components/favorite-button"

interface Listing {
  _id: string
  title: string
  price?: number
  location?: {
    city?: string
    department?: string
  }
  images?: string[]
  propertyType?: string
  surface?: number
  renovationScore?: number
}

function formatPrice(price?: number): string {
  if (!price) return "Prix NC"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price)
}

function getScoreColor(score?: number): string {
  if (score === undefined || score === null) return "bg-muted text-muted-foreground"
  if (score >= 80) return "bg-emerald-500 text-white"
  if (score >= 60) return "bg-amber-500 text-white"
  if (score >= 40) return "bg-orange-500 text-white"
  return "bg-red-500 text-white"
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetch("/api/favorites?full=true")
        .then(res => res.json())
        .then(data => {
          setFavorites(data.favorites || [])
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    } else if (status !== "loading") {
      setIsLoading(false)
    }
  }, [session, status])

  const handleRemoveFavorite = (listingId: string) => {
    setFavorites(prev => prev.filter(l => l._id !== listingId))
  }

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
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Mes favoris</h1>
              <p className="text-muted-foreground mb-6">
                Connectez-vous pour accéder à vos annonces favorites et les retrouver facilement.
              </p>
              <Button onClick={() => signIn("google")} size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                Se connecter avec Google
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                Mes favoris
              </h1>
              <p className="text-muted-foreground">
                {favorites.length} annonce{favorites.length !== 1 ? "s" : ""} sauvegardée{favorites.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/search">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Link>
            </Button>
          </div>

          {/* Favorites Grid */}
          {favorites.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Aucun favori</h2>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez pas encore sauvegardé d'annonces. Parcourez les biens disponibles et cliquez sur le cœur pour les ajouter à vos favoris.
                </p>
                <Button asChild>
                  <Link href="/search">
                    <Search className="w-4 h-4 mr-2" />
                    Découvrir les annonces
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((listing) => (
                <Link key={listing._id} href={`/l/${listing._id}`}>
                  <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Score Badge */}
                      {typeof listing.renovationScore === "number" && (
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(listing.renovationScore)}`}>
                          {listing.renovationScore}/100
                        </div>
                      )}

                      {/* Favorite Button */}
                      <div className="absolute top-3 right-3">
                        <FavoriteButton 
                          listingId={listing._id}
                          initialFavorites={favorites.map(f => f._id)}
                        />
                      </div>

                      {/* Price Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-xl font-bold">
                          {formatPrice(listing.price)}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {listing.location?.city || "Ville inconnue"}
                        </span>
                        {listing.surface && (
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-4 h-4" />
                            {listing.surface} m²
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

