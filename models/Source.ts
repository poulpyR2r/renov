import { dbConnect } from "@/lib/mongodb"

export async function getSourceModel() {
  const db = await dbConnect()
  const collection = db.collection("sources")

  await collection.createIndex({ name: 1 }, { unique: true })
  await collection.createIndex({ isActive: 1 })

  return collection
}
