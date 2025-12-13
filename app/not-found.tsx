import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-radial-gradient flex items-center justify-center">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Pagina non trovata</h2>
        <p className="text-muted-foreground mb-8">
          Il Digital Twin che stai cercando non esiste o non è più disponibile.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Torna alla home
          </Button>
        </Link>
      </div>
    </div>
  )
}

