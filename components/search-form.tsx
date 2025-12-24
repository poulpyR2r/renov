"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
      <Input
        type="text"
        placeholder="Ville, département, région..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="lg">
        <Search className="w-4 h-4 mr-2" />
        Rechercher
      </Button>
    </form>
  )
}
