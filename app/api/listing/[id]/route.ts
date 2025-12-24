export const dynamic = "force-dynamic"
export const revalidate = 0

import { type NextRequest, NextResponse } from "next/server"
import { getListingModel } from "@/models/Listing"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const Listing = await getListingModel()
    const listing = await Listing.findOne({
      _id: new ObjectId(params.id),
      status: "active",
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error: any) {
    console.error("Get listing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
