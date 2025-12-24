"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    propertyType: "",
    surface: "",
    url: "",
    email: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: { city: formData.city },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push("/")
      } else {
        toast.error(data.error || "Erreur lors de la soumission")
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
              <CardTitle>Soumettre une annonce</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre *</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix (€) *</label>
                    <Input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Surface (m²)</label>
                    <Input
                      type="number"
                      value={formData.surface}
                      onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville *</label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Type de bien *</label>
                    <Select
                      required
                      value={formData.propertyType}
                      onValueChange={(v) => setFormData({ ...formData, propertyType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">Maison</SelectItem>
                        <SelectItem value="apartment">Appartement</SelectItem>
                        <SelectItem value="building">Immeuble</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL de l'annonce</label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi..." : "Soumettre"}
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
