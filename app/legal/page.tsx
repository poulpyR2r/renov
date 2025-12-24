import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Mentions légales</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>Éditeur du site</h2>
              <p>RenovScout</p>

              <h2>Hébergement</h2>
              <p>Ce site est hébergé par Vercel Inc.</p>

              <h2>Propriété intellectuelle</h2>
              <p>L'ensemble du contenu de ce site est la propriété de RenovScout.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
