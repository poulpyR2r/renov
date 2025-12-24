import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Home } from "lucide-react"
import Image from "next/image"

interface ListingCardProps {
  listing: any
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images?.[0] || "/placeholder.svg?height=300&width=400"

  return (
    <Link href={`/l/${listing._id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <Image src={imageUrl || "/placeholder.svg"} alt={listing.title} fill className="object-cover" />
          <Badge className="absolute top-2 right-2 bg-orange-500">Score: {listing.renovationScore}</Badge>
        </div>

        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{listing.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{listing.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {listing.location.city}
            </div>
            {listing.surface && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Home className="w-4 h-4" />
                {listing.surface}m²
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-2xl font-bold text-blue-600">{listing.price.toLocaleString("fr-FR")} €</div>
          <Badge variant="outline">{listing.sourceName}</Badge>
        </CardFooter>
      </Card>
    </Link>
  )
}
