import { type NextRequest, NextResponse } from "next/server"
import { getOptOutRequestModel } from "@/models/OptOutRequest"
import { getListingModel } from "@/models/Listing"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, email, reason } = body

    const OptOutRequest = await getOptOutRequestModel()
    const optoutRequest = {
      listingId,
      email,
      reason,
      status: "pending" as const,
      createdAt: new Date(),
    }

    const result = await OptOutRequest.insertOne(optoutRequest)

    const Listing = await getListingModel()
    await Listing.updateOne({ _id: new ObjectId(listingId) }, { $set: { status: "opted_out" } })

    return NextResponse.json({
      success: true,
      message: "Demande de retrait enregistrée.",
    })
  } catch (error: any) {
    console.error("Opt-out error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
