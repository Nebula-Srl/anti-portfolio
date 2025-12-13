'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VoiceAgent, type TranscriptEntry } from '@/components/voice-agent'
import { InterviewProgress } from '@/components/interview-progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { INTERVIEWER_SYSTEM_PROMPT } from '@/lib/prompts'
import { TOTAL_FIXED_QUESTIONS, MAX_TOTAL_QUESTIONS } from '@/lib/constants'
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, User } from 'lucide-react'
import type { TwinProfile } from '@/lib/supabase/client'

type CreateState = 'intro' | 'interviewing' | 'confirming' | 'processing' | 'success' | 'error'

interface TwinResult {
  slug: string
  url: string
}

interface PendingTwin {
  profile: TwinProfile
  slug: string
}

export default function CreatePage() {
  const router = useRouter()
  const [state, setState] = useState<CreateState>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [isDeepening, setIsDeepening] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [twinResult, setTwinResult] = useState<TwinResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingTwin, setPendingTwin] = useState<PendingTwin | null>(null)

  // Track question progress based on transcript
  const handleTranscriptUpdate = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries)
    
    // Count assistant messages to estimate question progress
    const assistantMessages = entries.filter(e => e.role === 'assistant').length
    
    // Update current question number (max 10)
    const questionNum = Math.min(assistantMessages, MAX_TOTAL_QUESTIONS)
    setCurrentQuestion(questionNum)
    
    // Deepening starts after fixed questions
    setIsDeepening(assistantMessages > TOTAL_FIXED_QUESTIONS)
  }, [])

  // Handle profile detection - show confirmation modal
  const handleProfileDetected = useCallback((profile: unknown, slug: string) => {
    setPendingTwin({
      profile: profile as TwinProfile,
      slug
    })
    setState('confirming')
  }, [])

  // Confirm and save the twin
  const confirmAndSaveTwin = useCallback(async () => {
    if (!pendingTwin) return
    
    setState('processing')
    
    try {
      const { profile, slug } = pendingTwin

      // Validate slug
      const validateResponse = await fetch('/api/twins/validate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
      
      const validateResult = await validateResponse.json()
      
      if (!validateResult.valid) {
        setError(validateResult.error || 'Slug non valido')
        setState('error')
        return
      }

      // Build full transcript text
      const fullTranscript = transcript
        .map(entry => `${entry.role === 'user' ? 'UTENTE' : 'AI'}: ${entry.text}`)
        .join('\n\n')

      // Extract display name from profile
      const displayName = extractDisplayName(profile, slug)

      // Save twin
      const saveResponse = await fetch('/api/twins/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: validateResult.slug,
          displayName,
          profile,
          transcript: fullTranscript
        })
      })

      const saveResult = await saveResponse.json()

      if (!saveResult.success) {
        setError(saveResult.error || 'Errore nel salvataggio')
        setState('error')
        return
      }

      setTwinResult({
        slug: saveResult.twin.slug,
        url: saveResult.twin.url
      })
      setState('success')
    } catch (err) {
      console.error('Error saving twin:', err)
      setError('Errore durante il salvataggio. Riprova.')
      setState('error')
    }
  }, [pendingTwin, transcript])

  // Cancel confirmation and go back to interview
  const cancelConfirmation = useCallback(() => {
    setPendingTwin(null)
    setState('interviewing')
  }, [])

  // Extract a display name from the profile
  function extractDisplayName(profile: TwinProfile, slug: string): string {
    const identity = profile.identity_summary || ''
    const nameMatch = identity.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[0]
    
    if (nameMatch && nameMatch.length > 2) {
      return nameMatch
    }
    
    return slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleCopyLink = useCallback(() => {
    if (twinResult?.url) {
      navigator.clipboard.writeText(twinResult.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [twinResult])

  const startInterview = useCallback(() => {
    setState('interviewing')
  }, [])

  return (
    <div className="min-h-screen bg-radial-gradient">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Torna alla home
            </Button>
          </Link>
        </div>

        {/* Intro State */}
        {state === 'intro' && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Crea il tuo Digital Twin
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Stai per iniziare un&apos;intervista vocale con un&apos;AI. 
              Ti verranno fatte alcune domande per creare un profilo che catturi chi sei veramente.
            </p>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Prima di iniziare:</h3>
                <ul className="text-left text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Assicurati di essere in un ambiente tranquillo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Concedi l&apos;accesso al microfono quando richiesto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>L&apos;intervista dura circa 5 minuti</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Rispondi con sincerità e dettagli</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button size="lg" onClick={startInterview} className="gap-2">
              Inizia l&apos;intervista
            </Button>
          </div>
        )}

        {/* Interviewing State - New Layout */}
        {state === 'interviewing' && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
            {/* Left/Center: Voice Agent */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-6">Intervista in corso</h1>
                <InterviewProgress 
                  currentQuestion={currentQuestion}
                  isDeepening={isDeepening}
                />
              </div>

              <VoiceAgent
                systemPrompt={INTERVIEWER_SYSTEM_PROMPT}
                onTranscriptUpdate={handleTranscriptUpdate}
                onProfileDetected={handleProfileDetected}
                autoConnect={true}
                showTranscript={false}
              />
            </div>

            {/* Right: Transcript (Desktop only) */}
            <div className="hidden lg:block w-96 shrink-0">
              <div className="sticky top-8">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                  Trascrizione
                </h3>
                <div className="bg-card border border-border rounded-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      La trascrizione apparirà qui...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((entry, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg text-sm ${
                            entry.role === 'user' 
                              ? 'bg-primary/10 text-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <span className="font-medium block mb-1 text-xs uppercase tracking-wide opacity-60">
                            {entry.role === 'user' ? 'Tu' : 'AI'}
                          </span>
                          {entry.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <Dialog open={state === 'confirming'} onOpenChange={(open) => !open && cancelConfirmation()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Conferma creazione Twin
              </DialogTitle>
              <DialogDescription>
                Stai per creare il tuo Digital Twin con il nome:
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-lg font-mono font-semibold text-primary">
                  /t/{pendingTwin?.slug}
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={cancelConfirmation}>
                Annulla
              </Button>
              <Button onClick={confirmAndSaveTwin}>
                Conferma e Crea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Processing State */}
        {state === 'processing' && (
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Creazione in corso...</h2>
            <p className="text-muted-foreground">
              Stiamo elaborando le tue risposte e creando il tuo Digital Twin.
            </p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && twinResult && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              Il tuo Digital Twin è pronto!
            </h2>
            <p className="text-muted-foreground mb-8">
              Condividi questo link con chiunque voglia conoscerti meglio.
            </p>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="flex-1 text-sm truncate">
                    {twinResult.url}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                {copied ? 'Copiato!' : 'Copia link'}
              </Button>
              <Button 
                onClick={() => router.push(`/t/${twinResult.slug}`)}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visita il tuo Twin
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">!</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Si è verificato un errore</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Qualcosa è andato storto. Riprova.'}
            </p>

            <Button onClick={() => setState('intro')}>
              Riprova
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
