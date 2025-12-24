import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Politique de confidentialité</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>Collecte des données</h2>
              <p>RenovScout collecte uniquement les données nécessaires au fonctionnement du service.</p>

              <h2>Utilisation des données</h2>
              <p>Les données sont utilisées uniquement pour afficher les annonces immobilières.</p>

              <h2>Vos droits</h2>
              <p>
                Vous pouvez demander le retrait de toute annonce vous concernant via le formulaire prévu à cet effet.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
