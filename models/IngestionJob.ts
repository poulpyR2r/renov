import { dbConnect } from "@/lib/mongodb"

export async function getIngestionJobModel() {
  const db = await dbConnect()
  const collection = db.collection("ingestion_jobs")

  await collection.createIndex({ sourceId: 1 })
  await collection.createIndex({ status: 1 })
  await collection.createIndex({ createdAt: -1 })

  return collection
}
