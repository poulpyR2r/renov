import { dbConnect } from "@/lib/mongodb"

export async function getListingModel() {
  const db = await dbConnect()
  const collection = db.collection("listings")

  await collection.createIndex({ fingerprint: 1 }, { unique: true, sparse: true })
  await collection.createIndex({ sourceId: 1, externalId: 1 })
  await collection.createIndex({ status: 1 })
  await collection.createIndex({ renovationScore: -1 })
  await collection.createIndex({ "location.city": 1 })
  await collection.createIndex({ propertyType: 1 })
  await collection.createIndex({ price: 1 })
  await collection.createIndex({ createdAt: -1 })

  return collection
}
