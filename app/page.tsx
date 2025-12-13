'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Share2, MessageSquare, Sparkles, Link as LinkIcon } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [portfolioUrl, setPortfolioUrl] = useState('')

  const handleCreateTwin = () => {
    // Store portfolio URL in sessionStorage to use during interview
    if (portfolioUrl.trim()) {
      sessionStorage.setItem('portfolioUrl', portfolioUrl.trim())
    }
    router.push('/create')
  }

  return (
    <div className="min-h-screen bg-radial-gradient">
      {/* Background grid pattern */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Powered by AI Voice
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Crea il tuo <span className="gradient-text">Digital Twin</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Un&apos;intervista vocale con l&apos;AI cattura la tua essenza. Il
              tuo twin risponde per te, condivisibile con chiunque tramite un
              link unico.
            </p>

            {/* Portfolio Input + CTA */}
            <div className="max-w-md mx-auto space-y-4 mb-6">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Link al tuo portfolio (LinkedIn, GitHub, Behance...)"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="pl-10 h-12 bg-card border-border text-base"
                />
              </div>
              
              <Button
                size="lg"
                onClick={handleCreateTwin}
                className="w-full text-lg h-14 rounded-xl gap-2 animate-glow"
              >
                <Mic className="w-5 h-5" />
                Crea il tuo Twin
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="text-sm text-muted-foreground">
              5 minuti di intervista • Nessuna registrazione richiesta • Gratis
            </p>
          </div>

          {/* How it works */}
          <div className="mt-32 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">
              Come funziona
            </h2>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Mic className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Intervista Vocale
                  </h3>
                  <p className="text-muted-foreground">
                    Parla con l&apos;AI che ti fa domande approfondite su chi
                    sei, come pensi e cosa ti rende unico.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Creazione Twin</h3>
                  <p className="text-muted-foreground">
                    L&apos;AI elabora le tue risposte e crea un profilo che
                    cattura la tua personalità e il tuo modo di comunicare.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Share2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Condividi</h3>
                  <p className="text-muted-foreground">
                    Ottieni un link unico. Chiunque può parlare con il tuo twin
                    per conoscerti meglio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Use cases */}
          <div className="mt-32 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Perfetto per
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Recruiter e HR</h3>
                <p className="text-muted-foreground text-sm">
                  Permetti ai recruiter di &quot;parlare&quot; con te prima di
                  un colloquio, risparmiando tempo a entrambi.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Portfolio Creativo
                </h3>
                <p className="text-muted-foreground text-sm">
                  Aggiungi una dimensione interattiva al tuo portfolio. I
                  clienti possono chiederti direttamente.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Personal Branding
                </h3>
                <p className="text-muted-foreground text-sm">
                  Crea una versione di te sempre disponibile per rispondere a
                  curiosità e domande.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Networking</h3>
                <p className="text-muted-foreground text-sm">
                  Condividi il tuo twin dopo un evento. Chi ti ha incontrato può
                  approfondire la conoscenza.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-32 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Pronto a creare il tuo Digital Twin?
            </h2>
            <Button 
              size="lg" 
              onClick={handleCreateTwin}
              className="text-lg px-8 py-6 rounded-xl gap-2"
            >
              <Mic className="w-5 h-5" />
              Inizia l&apos;intervista
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Digital Twin Portfolio • Creato con AI Voice Technology</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
