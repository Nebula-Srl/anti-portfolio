'use client'

import { useState, useCallback, useMemo } from 'react'
import { VoiceAgent, type TranscriptEntry } from '@/components/voice-agent'
import { Button } from '@/components/ui/button'
import { generateEditSystemPrompt } from '@/lib/prompts'
import type { TwinProfile } from '@/lib/supabase/client'
import type { ProfileSection } from '@/lib/types'
import { Mic, StopCircle, Loader2 } from 'lucide-react'

interface EditProfileVoiceProps {
  displayName: string
  section: ProfileSection
  currentValue: string
  fullProfile: TwinProfile
  onUpdateExtracted: (updatedProfile: Partial<TwinProfile>) => void
  onCancel: () => void
}

export function EditProfileVoice({
  displayName,
  section,
  currentValue,
  fullProfile,
  onUpdateExtracted,
  onCancel,
}: EditProfileVoiceProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate system prompt for this section
  const systemPrompt = useMemo(() => {
    return generateEditSystemPrompt(displayName, section, currentValue, fullProfile)
  }, [displayName, section, currentValue, fullProfile])

  const handleTranscriptUpdate = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries)
  }, [])

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
  }, [])

  const handleStop = useCallback(async () => {
    if (transcript.length === 0) {
      setError('Nessuna conversazione da salvare')
      return
    }

    // Check for JSON in transcript (from AI response)
    const fullTranscript = transcript
      .map((entry) => `${entry.role === 'user' ? 'UTENTE' : 'AI'}: ${entry.text}`)
      .join('\n\n')

    // Look for JSON block
    const jsonMatch = fullTranscript.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.updated_section && parsed.updated_value) {
          // Direct JSON extraction
          onUpdateExtracted({
            [section]: parsed.updated_value,
          })
          return
        }
      } catch (err) {
        console.error('JSON parse error:', err)
      }
    }

    // Fallback: call voice-update API
    setIsExtracting(true)
    setError(null)

    try {
      const editToken = sessionStorage.getItem('editToken')
      const twinId = sessionStorage.getItem('editingTwinId')

      if (!editToken || !twinId) {
        throw new Error('Sessione scaduta')
      }

      const response = await fetch('/api/twins/edit/voice-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editToken,
          twinId,
          transcript: fullTranscript,
          section,
        }),
      })

      const data = await response.json()

      if (data.success && data.updatedProfile) {
        onUpdateExtracted({
          [section]: data.updatedProfile[section],
        })
      } else {
        setError(data.error || 'Errore nell\'estrazione')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di connessione')
    } finally {
      setIsExtracting(false)
    }
  }, [transcript, section, onUpdateExtracted])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Modifica Vocale</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Parla con l'assistente AI per migliorare questa sezione del tuo profilo
        </p>
      </div>

      {/* Voice Agent */}
      <div className="border border-white/20 rounded-lg p-6 bg-white/5">
        <VoiceAgent
          systemPrompt={systemPrompt}
          onTranscriptUpdate={handleTranscriptUpdate}
          onConnectionChange={handleConnectionChange}
          autoConnect={false}
          showTranscript={true}
          showControls={true}
          showStopButton={false}
          showReadyPrompt={false}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {isConnected ? (
          <Button
            onClick={handleStop}
            disabled={isExtracting}
            variant="default"
            className="flex-1"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Estrazione in corso...
              </>
            ) : (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                Completa e Salva
              </>
            )}
          </Button>
        ) : null}

        <Button
          onClick={onCancel}
          variant="ghost"
          disabled={isConnected || isExtracting}
        >
          Annulla
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}

