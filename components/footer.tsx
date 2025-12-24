import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="font-semibold mb-3">RenovScout</h3>
            <p className="text-sm text-muted-foreground">
              Votre moteur de recherche pour trouver des biens immobiliers à rénover
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-primary">
                  Rechercher
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-primary">
                  Soumettre
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal" className="hover:text-primary">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/optout" className="hover:text-primary">
                  Retirer une annonce
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground border-t pt-6">
          © {new Date().getFullYear()} RenovScout. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
