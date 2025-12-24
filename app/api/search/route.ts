export const dynamic = "force-dynamic"
export const revalidate = 0

import { type NextRequest, NextResponse } from "next/server"
import { getListingModel } from "@/models/Listing"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const city = searchParams.get("city")
    const propertyType = searchParams.get("propertyType")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const minSurface = searchParams.get("minSurface")
    const source = searchParams.get("source")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const Listing = await getListingModel()

    const filter: any = { status: "active" }

    if (query) {
      filter.$or = [{ title: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }]
    }

    if (city) filter["location.city"] = city
    if (propertyType) filter.propertyType = propertyType
    if (minPrice) filter.price = { ...filter.price, $gte: Number.parseInt(minPrice) }
    if (maxPrice) filter.price = { ...filter.price, $lte: Number.parseInt(maxPrice) }
    if (minSurface) filter.surface = { $gte: Number.parseInt(minSurface) }
    if (source) filter.sourceName = source

    const skip = (page - 1) * limit

    const [listings, total] = await Promise.all([
      Listing.find(filter).sort({ renovationScore: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
      Listing.countDocuments(filter),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
