import { dbConnect } from "@/lib/mongodb"

export async function getOptOutRequestModel() {
  const db = await dbConnect()
  const collection = db.collection("optout_requests")

  await collection.createIndex({ listingId: 1 })
  await collection.createIndex({ status: 1 })
  await collection.createIndex({ createdAt: -1 })

  return collection
}
