"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function OptOutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listingId = searchParams.get("listing")

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    listingId: listingId || "",
    email: "",
    reason: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push("/")
      } else {
        toast.error(data.error || "Erreur")
      }
    } catch (error) {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Retirer une annonce</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ID de l'annonce *</label>
                  <Input
                    required
                    value={formData.listingId}
                    onChange={(e) => setFormData({ ...formData, listingId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Votre email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Raison</label>
                  <Textarea
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer la demande"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
