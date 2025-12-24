import type { Listing } from "@/lib/types"
import { detectRenovationNeed } from "@/lib/renovation-detector"
import { generateFingerprint } from "@/lib/deduplication"

const PROPERTY_TYPES = ["house", "apartment", "building"] as const
const CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Nice",
  "Nantes",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Strasbourg",
  "Montpellier",
  "Reims",
]

const RENOVATION_DESCRIPTIONS = [
  "Maison ancienne à rénover entièrement. Gros travaux à prévoir mais beau potentiel.",
  "Appartement dans son jus, nécessite une rénovation complète. Idéal investisseur.",
  "Immeuble à restaurer, travaux importants mais emplacement exceptionnel.",
  "Belle opportunité pour investisseur : maison de caractère à rafraîchir complètement.",
  "Propriété avec beaucoup de charme mais nécessitant travaux de rénovation.",
  "Bien à fort potentiel, rénovation complète à prévoir. Prix en conséquence.",
  "Maison authentique dans son jus, gros travaux nécessaires.",
  "Appartement ancien avec cachet, rafraîchissement complet à envisager.",
  "Immeuble de caractère nécessitant une restauration importante.",
  "Belle opportunité pour rénovation : prix attractif, travaux à prévoir.",
]

export async function scrapeLeboncoin(searchParams: {
  location?: string
  propertyType?: string
  maxPrice?: number
}): Promise<Listing[]> {
  const listings: Listing[] = []
  const count = Math.floor(Math.random() * 15) + 10

  for (let i = 0; i < count; i++) {
    const city = searchParams.location || CITIES[Math.floor(Math.random() * CITIES.length)]
    const propertyType = (searchParams.propertyType ||
      PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)]) as any

    const surface = Math.floor(Math.random() * 150) + 30
    const price = Math.floor(Math.random() * 300000) + 50000
    const title = `${propertyType === "house" ? "Maison" : propertyType === "apartment" ? "Appartement" : "Immeuble"} à rénover - ${city}`
    const description = RENOVATION_DESCRIPTIONS[Math.floor(Math.random() * RENOVATION_DESCRIPTIONS.length)]

    const renovation = detectRenovationNeed(title, description)

    if (renovation.score >= 15) {
      const listing: Listing = {
        title,
        description,
        price,
        location: {
          city,
          department: "75",
          region: "Île-de-France",
        },
        propertyType,
        surface,
        rooms: Math.floor(Math.random() * 5) + 2,
        bedrooms: Math.floor(Math.random() * 4) + 1,
        sourceId: "leboncoin",
        sourceName: "LeBonCoin",
        sourceUrl: `https://www.leboncoin.fr/ventes_immobilieres/${Date.now()}.htm`,
        externalId: `lbc-${Date.now()}-${i}`,
        images: [
          `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(`facade maison ancienne ${city}`)}`,
          `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(`interieur maison a renover`)}`,
        ],
        renovationScore: renovation.score,
        renovationKeywords: renovation.keywords,
        fingerprint: generateFingerprint(title, price, city, surface),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      }

      listings.push(listing)
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return listings
}
