export interface Listing {
  _id?: string
  title: string
  description: string
  price: number
  location: {
    city: string
    department: string
    region: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  propertyType: "house" | "apartment" | "building" | "land" | "commercial" | "other"
  surface?: number
  rooms?: number
  bedrooms?: number
  sourceId: string
  sourceName: string
  sourceUrl: string
  externalId: string
  images: string[]
  renovationScore: number
  renovationKeywords: string[]
  fingerprint: string
  status: "active" | "pending" | "rejected" | "opted_out"
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface Source {
  _id?: string
  name: string
  url: string
  type: "scraper" | "manual" | "csv_import"
  isActive: boolean
  lastScrapedAt?: Date
  config?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface OptOutRequest {
  _id?: string
  listingId: string
  email?: string
  reason?: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  processedAt?: Date
}

export interface IngestionJob {
  _id?: string
  sourceId: string
  status: "pending" | "running" | "completed" | "failed"
  startedAt?: Date
  completedAt?: Date
  stats: {
    total: number
    added: number
    updated: number
    skipped: number
    errors: number
  }
  error?: string
  createdAt: Date
}
