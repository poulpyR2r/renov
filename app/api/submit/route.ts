import { type NextRequest, NextResponse } from "next/server"
import { getListingModel } from "@/models/Listing"
import { detectRenovationNeed } from "@/lib/renovation-detector"
import { generateFingerprint } from "@/lib/deduplication"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, location, propertyType, surface, url, email } = body

    const renovation = detectRenovationNeed(title, description)

    const listing = {
      title,
      description,
      price: Number.parseInt(price),
      location: {
        city: location.city,
        department: location.department || "",
        region: location.region || "",
      },
      propertyType,
      surface: surface ? Number.parseInt(surface) : undefined,
      sourceId: "user_submission",
      sourceName: "Soumission Utilisateur",
      sourceUrl: url || "",
      externalId: `sub-${Date.now()}`,
      images: [],
      renovationScore: renovation.score,
      renovationKeywords: renovation.keywords,
      fingerprint: generateFingerprint(title, Number.parseInt(price), location.city, surface),
      status: "pending" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const Listing = await getListingModel()
    const result = await Listing.insertOne(listing)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: "Annonce soumise avec succès. Elle sera vérifiée avant publication.",
    })
  } catch (error: any) {
    console.error("Submit error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
