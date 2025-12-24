import Link from "next/link"
import { Home } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Home className="w-6 h-6" />
          RenovScout
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="text-sm hover:text-primary">
            Rechercher
          </Link>
          <Link href="/submit" className="text-sm hover:text-primary">
            Soumettre une annonce
          </Link>
          <Link href="/admin" className="text-sm hover:text-primary">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
