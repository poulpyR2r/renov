import { MongoClient, type Db } from "mongodb"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const MONGODB_URI = process.env.MONGODB_URI

let cached = global._mongoClientPromise

if (!cached && MONGODB_URI) {
  const client = new MongoClient(MONGODB_URI)
  cached = global._mongoClientPromise = client.connect()
}

export async function dbConnect(): Promise<Db> {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI environment variable")
  }

  if (!cached) {
    const client = new MongoClient(MONGODB_URI)
    cached = global._mongoClientPromise = client.connect()
  }

  const client = await cached
  return client.db("renovscout")
}
