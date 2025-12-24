import { type NextRequest, NextResponse } from "next/server"
import { getListingModel } from "@/models/Listing"
import { scrapeLeboncoin } from "@/lib/scrapers/leboncoin-scraper"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sources, searchParams } = body

    const allListings: any[] = []
    const stats = {
      total: 0,
      added: 0,
      skipped: 0,
      errors: 0,
    }

    if (sources.includes("leboncoin") || sources.includes("seloger") || sources.includes("pap")) {
      const listings = await scrapeLeboncoin(searchParams || {})

      const Listing = await getListingModel()

      for (const listing of listings) {
        try {
          const existing = await Listing.findOne({ fingerprint: listing.fingerprint })

          if (!existing) {
            await Listing.insertOne(listing)
            stats.added++
            allListings.push(listing)
          } else {
            stats.skipped++
          }

          stats.total++
        } catch (error: any) {
          console.error("Error inserting listing:", error)
          stats.errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      listings: allListings.slice(0, 10),
    })
  } catch (error: any) {
    console.error("Scrape error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
