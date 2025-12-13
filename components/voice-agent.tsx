'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createRealtimeClient, type RealtimeClient } from '@/lib/openai/realtime'
import { OPENAI_REALTIME_MODEL, OPENAI_REALTIME_VOICE } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { AudioVisualizer } from './audio-visualizer'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface VoiceAgentProps {
  systemPrompt: string
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void
  onProfileDetected?: (profile: unknown, slug: string) => void
  onConnectionChange?: (connected: boolean) => void
  autoConnect?: boolean
  showTranscript?: boolean
  className?: string
}

export function VoiceAgent({
  systemPrompt,
  onTranscriptUpdate,
  onProfileDetected,
  onConnectionChange,
  autoConnect = false,
  showTranscript = true,
  className = ''
}: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  
  const clientRef = useRef<RealtimeClient | null>(null)
  const transcriptRef = useRef<TranscriptEntry[]>([])
  const hasInitiatedRef = useRef(false)
  const mountedRef = useRef(true)

  // Check for JSON profile in transcript
  const checkForProfile = useCallback((text: string) => {
    // Look for JSON block in the assistant's message
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.twin_profile && parsed.slug_confirmed) {
          onProfileDetected?.(parsed.twin_profile, parsed.slug_confirmed)
        }
      } catch {
        // Not valid JSON, ignore
      }
    }
  }, [onProfileDetected])

  const handleTranscript = useCallback((text: string, role: 'user' | 'assistant') => {
    if (!mountedRef.current) return
    
    const entry: TranscriptEntry = {
      role,
      text,
      timestamp: new Date()
    }
    
    transcriptRef.current = [...transcriptRef.current, entry]
    setTranscript(transcriptRef.current)
    onTranscriptUpdate?.(transcriptRef.current)

    // Check for profile in assistant messages
    if (role === 'assistant') {
      checkForProfile(text)
    }
  }, [onTranscriptUpdate, checkForProfile])

  const connect = useCallback(async () => {
    if (isConnecting || isConnected || clientRef.current) {
      console.log('Already connected or connecting, skipping')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Get ephemeral token from our API
      const tokenResponse = await fetch('/api/realtime/token')
      if (!tokenResponse.ok) {
        throw new Error('Impossibile ottenere il token di connessione')
      }
      
      const { token } = await tokenResponse.json()

      // Create and connect realtime client
      const client = createRealtimeClient({
        token,
        model: OPENAI_REALTIME_MODEL,
        voice: OPENAI_REALTIME_VOICE,
        systemPrompt,
        onTranscript: handleTranscript,
        onAudioStart: () => {
          if (mountedRef.current) setIsSpeaking(true)
        },
        onAudioEnd: () => {
          if (mountedRef.current) setIsSpeaking(false)
        },
        onError: (err) => {
          if (mountedRef.current) setError(err.message)
        },
        onConnectionChange: (connected) => {
          if (!mountedRef.current) return
          setIsConnected(connected)
          setIsConnecting(false)
          onConnectionChange?.(connected)
        }
      })

      clientRef.current = client
      await client.connect()
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Errore di connessione')
        setIsConnecting(false)
      }
    }
  }, [isConnecting, isConnected, systemPrompt, handleTranscript, onConnectionChange])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect()
      clientRef.current = null
    }
    setIsConnected(false)
    setIsSpeaking(false)
  }, [])

  // Auto-connect if enabled (only once)
  useEffect(() => {
    if (autoConnect && !hasInitiatedRef.current && !isConnected && !isConnecting) {
      hasInitiatedRef.current = true
      connect()
    }
  }, [autoConnect, isConnected, isConnecting, connect])

  // Track mounted state and cleanup
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.disconnect()
        clientRef.current = null
      }
    }
  }, [])

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Audio Visualizer */}
      <AudioVisualizer 
        isActive={isConnected} 
        isSpeaking={isSpeaking}
        size={180}
      />

      {/* Status */}
      <div className="text-center">
        {isConnecting && (
          <p className="text-muted-foreground animate-pulse">
            Connessione in corso...
          </p>
        )}
        {isConnected && !isSpeaking && (
          <p className="text-muted-foreground flex items-center gap-2 justify-center">
            <Mic className="w-4 h-4 text-green-500" />
            In ascolto...
          </p>
        )}
        {isConnected && isSpeaking && (
          <p className="text-muted-foreground flex items-center gap-2 justify-center">
            <MicOff className="w-4 h-4 text-amber-500" />
            L&apos;AI sta parlando...
          </p>
        )}
        {error && (
          <p className="text-destructive">{error}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isConnected ? (
          <Button
            size="lg"
            onClick={connect}
            disabled={isConnecting}
            className="gap-2"
          >
            <Phone className="w-5 h-5" />
            {isConnecting ? 'Connessione...' : 'Avvia Conversazione'}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            onClick={disconnect}
            className="gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Termina
          </Button>
        )}
      </div>

      {/* Live Transcript Preview (optional) */}
      {showTranscript && transcript.length > 0 && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Trascrizione
            </h4>
            <div className="space-y-3">
              {transcript.slice(-5).map((entry, i) => (
                <div 
                  key={i}
                  className={`text-sm ${
                    entry.role === 'user' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground italic'
                  }`}
                >
                  <span className="font-medium">
                    {entry.role === 'user' ? 'Tu: ' : 'AI: '}
                  </span>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export utility to get transcript
export type { TranscriptEntry }
