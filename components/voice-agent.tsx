"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createRealtimeClient,
  type RealtimeClient,
} from "@/lib/openai/realtime";
import {
  OPENAI_REALTIME_MODEL,
  OPENAI_REALTIME_VOICE,
  SILENCE_TIMEOUT_SECONDS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, Clock } from "lucide-react";
import { AudioVisualizer } from "./audio-visualizer";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface VoiceAgentProps {
  systemPrompt: string;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onProfileDetected?: (profile: unknown) => void;
  onConnectionChange?: (connected: boolean) => void;
  onSilenceTimeout?: () => void;
  autoConnect?: boolean;
  showTranscript?: boolean;
  className?: string;
}

// Filter JSON blocks from text for display purposes
function filterJsonFromText(text: string): string {
  // Remove JSON code blocks
  let filtered = text.replace(/```json[\s\S]*?```/g, "");
  // Remove any remaining raw JSON objects that look like twin_profile
  filtered = filtered.replace(/\{[\s\S]*?"twin_profile"[\s\S]*?\}/g, "");
  // Clean up extra whitespace
  filtered = filtered.replace(/\s+/g, " ").trim();
  return filtered;
}

// Check if text contains JSON profile
function containsJsonProfile(text: string): boolean {
  return text.includes("```json") && text.includes("twin_profile");
}

export function VoiceAgent({
  systemPrompt,
  onTranscriptUpdate,
  onProfileDetected,
  onConnectionChange,
  onSilenceTimeout,
  autoConnect = false,
  showTranscript = true,
  className = "",
}: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [displayTranscript, setDisplayTranscript] = useState<TranscriptEntry[]>(
    []
  );
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const hasInitiatedRef = useRef(false);
  const mountedRef = useRef(true);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const profileDetectedRef = useRef(false);

  // Disconnect function - defined early so it can be used in checkForProfile
  const disconnect = useCallback(() => {
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setSilenceCountdown(null);

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    // Clear existing timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setSilenceCountdown(null);

    // Don't set timer if profile already detected or not connected
    if (profileDetectedRef.current || !mountedRef.current) return;

    // Start countdown display when 10 seconds remain
    const warningTime = Math.max(0, SILENCE_TIMEOUT_SECONDS - 10);

    // Set warning countdown
    setTimeout(() => {
      if (!mountedRef.current || profileDetectedRef.current) return;

      let remaining = 10;
      setSilenceCountdown(remaining);

      countdownIntervalRef.current = setInterval(() => {
        remaining--;
        if (
          remaining <= 0 ||
          !mountedRef.current ||
          profileDetectedRef.current
        ) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          setSilenceCountdown(null);
        } else {
          setSilenceCountdown(remaining);
        }
      }, 1000);
    }, warningTime * 1000);

    // Set main timeout
    silenceTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !profileDetectedRef.current) {
        console.log("Silence timeout reached");
        onSilenceTimeout?.();
      }
    }, SILENCE_TIMEOUT_SECONDS * 1000);
  }, [onSilenceTimeout]);

  // Check for JSON profile in transcript
  const checkForProfile = useCallback(
    (text: string) => {
      // Look for JSON block in the assistant's message
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          // Accept profile with or without slug_confirmed (slug is now pre-set)
          if (parsed.twin_profile) {
            profileDetectedRef.current = true;

            // Clear silence timer since we're done
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            setSilenceCountdown(null);

            // IMMEDIATELY disconnect to stop speech-to-speech
            disconnect();

            // Then call the callback
            onProfileDetected?.(parsed.twin_profile);
          }
        } catch {
          // Not valid JSON, ignore
        }
      }
    },
    [onProfileDetected, disconnect]
  );

  const handleTranscript = useCallback(
    (text: string, role: "user" | "assistant") => {
      if (!mountedRef.current) return;

      // Reset silence timer on any activity
      resetSilenceTimer();

      const entry: TranscriptEntry = {
        role,
        text,
        timestamp: new Date(),
      };

      transcriptRef.current = [...transcriptRef.current, entry];
      setTranscript(transcriptRef.current);
      onTranscriptUpdate?.(transcriptRef.current);

      // Update display transcript (filter JSON from assistant messages)
      if (role === "assistant" && containsJsonProfile(text)) {
        // Don't add JSON-containing messages to display
        const filteredText = filterJsonFromText(text);
        if (filteredText) {
          setDisplayTranscript((prev) => [
            ...prev,
            { role, text: filteredText, timestamp: new Date() },
          ]);
        }
      } else {
        setDisplayTranscript((prev) => [...prev, entry]);
      }

      // Check for profile in assistant messages
      if (role === "assistant") {
        checkForProfile(text);
      }
    },
    [onTranscriptUpdate, checkForProfile, resetSilenceTimer]
  );

  const connect = useCallback(async () => {
    if (isConnecting || isConnected || clientRef.current) {
      console.log("Already connected or connecting, skipping");
      return;
    }

    setIsConnecting(true);
    setError(null);
    profileDetectedRef.current = false;

    try {
      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/realtime/token");
      if (!tokenResponse.ok) {
        throw new Error("Impossibile ottenere il token di connessione");
      }

      const { token } = await tokenResponse.json();

      // Create and connect realtime client
      const client = createRealtimeClient({
        token,
        model: OPENAI_REALTIME_MODEL,
        voice: OPENAI_REALTIME_VOICE,
        systemPrompt,
        onTranscript: handleTranscript,
        onAudioStart: () => {
          if (mountedRef.current) {
            setIsSpeaking(true);
            resetSilenceTimer(); // Reset on audio activity
          }
        },
        onAudioEnd: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
            resetSilenceTimer(); // Reset when AI stops speaking
          }
        },
        onError: (err) => {
          if (mountedRef.current) setError(err.message);
        },
        onConnectionChange: (connected) => {
          if (!mountedRef.current) return;
          setIsConnected(connected);
          setIsConnecting(false);
          onConnectionChange?.(connected);

          // Start silence timer when connected
          if (connected) {
            resetSilenceTimer();
          }
        },
      });

      clientRef.current = client;
      await client.connect();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Errore di connessione");
        setIsConnecting(false);
      }
    }
  }, [
    isConnecting,
    isConnected,
    systemPrompt,
    handleTranscript,
    onConnectionChange,
    resetSilenceTimer,
  ]);

  // Auto-connect if enabled (only once)
  useEffect(() => {
    if (
      autoConnect &&
      !hasInitiatedRef.current &&
      !isConnected &&
      !isConnecting
    ) {
      hasInitiatedRef.current = true;
      connect();
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

  // Track mounted state and cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Clear timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

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

        {/* Silence countdown warning */}
        {silenceCountdown !== null &&
          silenceCountdown > 0 &&
          silenceCountdown < 10 && (
            <p className="text-amber-500 flex items-center gap-2 justify-center mt-2 text-sm">
              <Clock className="w-4 h-4" />
              Silenzio rilevato. Disconnessione in {silenceCountdown}s...
            </p>
          )}

        {error && <p className="text-destructive">{error}</p>}
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
            {isConnecting ? "Connessione..." : "Avvia Conversazione"}
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

      {/* Live Transcript Preview (optional) - uses filtered displayTranscript */}
      {showTranscript && displayTranscript.length > 0 && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Trascrizione
            </h4>
            <div className="space-y-3">
              {displayTranscript.slice(-5).map((entry, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    entry.role === "user"
                      ? "text-foreground"
                      : "text-muted-foreground italic"
                  }`}
                >
                  <span className="font-medium">
                    {entry.role === "user" ? "Tu: " : "AI: "}
                  </span>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility to get transcript
export type { TranscriptEntry };
