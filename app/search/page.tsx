"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    city: searchParams.get("city") || "",
    propertyType: searchParams.get("propertyType") || "all", // Updated default value
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  })

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    const params = new URLSearchParams(filters as any)
    const response = await fetch(`/api/search?${params}`)
    const data = await response.json()
    setListings(data.listings || [])
    setLoading(false)
  }

  const handleSearch = () => {
    fetchListings()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">Rechercher un bien</h1>

          <div className="bg-card p-6 rounded-lg border mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />

              <Input
                placeholder="Ville"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />

              <Select value={filters.propertyType} onValueChange={(v) => setFilters({ ...filters, propertyType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem> {/* Updated value prop */}
                  <SelectItem value="house">Maison</SelectItem>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="building">Immeuble</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>Rechercher</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-4 text-muted-foreground">{listings.length} résultat(s) trouvé(s)</div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>

              {listings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Aucun résultat trouvé</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
