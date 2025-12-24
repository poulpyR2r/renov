export const dynamic = "force-dynamic"
export const revalidate = 0

import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getListingModel } from "@/models/Listing"
import { ObjectId } from "mongodb"
import { MapPin, Home, Bed, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  let listing: any = null

  try {
    const Listing = await getListingModel()
    listing = await Listing.findOne({
      _id: new ObjectId(params.id),
      status: "active",
    })
  } catch (error) {
    console.error("Error fetching listing:", error)
  }

  if (!listing) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Badge className="mb-2">Score rénovation: {listing.renovationScore}</Badge>
            <h1 className="text-4xl font-bold mb-4">{listing.title}</h1>

            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {listing.location.city}, {listing.location.department}
              </div>
              {listing.surface && (
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  {listing.surface}m²
                </div>
              )}
              {listing.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  {listing.bedrooms} chambres
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 mb-6">
            {listing.images?.map((img: string, idx: number) => (
              <div key={idx} className="relative h-96 rounded-lg overflow-hidden">
                <Image src={img || "/placeholder.svg"} alt={`Image ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl font-bold text-blue-600">{listing.price.toLocaleString("fr-FR")} €</div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {listing.sourceName}
                </Badge>
              </div>

              <div className="prose max-w-none mb-6">
                <h2 className="text-2xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.renovationKeywords?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Mots-clés détectés</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.renovationKeywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button asChild size="lg" className="flex-1">
              <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir l'annonce originale
              </a>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href={`/optout?listing=${listing._id}`}>Signaler / Retirer</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
