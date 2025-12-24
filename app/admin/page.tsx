"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState({
    leboncoin: true,
    seloger: true,
    pap: true,
  })
  const [stats, setStats] = useState<any>(null)

  const handleScrape = async () => {
    setLoading(true)
    setStats(null)

    try {
      const selectedSources = Object.entries(sources)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name)

      const response = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: selectedSources }),
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        toast.success(`Scraping terminé: ${data.stats.added} annonces ajoutées`)
      } else {
        toast.error(data.error || "Erreur lors du scraping")
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
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Panneau d'administration</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Lancer le scraping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="leboncoin"
                    checked={sources.leboncoin}
                    onCheckedChange={(checked) => setSources({ ...sources, leboncoin: !!checked })}
                  />
                  <label htmlFor="leboncoin" className="text-sm font-medium">
                    LeBonCoin
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seloger"
                    checked={sources.seloger}
                    onCheckedChange={(checked) => setSources({ ...sources, seloger: !!checked })}
                  />
                  <label htmlFor="seloger" className="text-sm font-medium">
                    SeLoger
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pap"
                    checked={sources.pap}
                    onCheckedChange={(checked) => setSources({ ...sources, pap: !!checked })}
                  />
                  <label htmlFor="pap" className="text-sm font-medium">
                    PAP (De Particulier à Particulier)
                  </label>
                </div>
              </div>

              <Button onClick={handleScrape} disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping en cours...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Lancer le scraping
                  </>
                )}
              </Button>

              {stats && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Résultats</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Total analysé: {stats.total}</div>
                    <div className="text-green-600">Ajouté: {stats.added}</div>
                    <div className="text-yellow-600">Ignoré (doublon): {stats.skipped}</div>
                    <div className="text-red-600">Erreurs: {stats.errors}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
