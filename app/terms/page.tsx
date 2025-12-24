import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Conditions d'utilisation</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>Utilisation du service</h2>
              <p>RenovScout est un moteur de recherche d'annonces immobilières à rénover.</p>

              <h2>Responsabilité</h2>
              <p>RenovScout n'est pas responsable du contenu des annonces, qui proviennent de sources tierces.</p>

              <h2>Modification du service</h2>
              <p>RenovScout se réserve le droit de modifier ou d'interrompre le service à tout moment.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
