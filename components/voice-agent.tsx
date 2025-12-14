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
import { Mic, MicOff, Phone, StopCircle } from "lucide-react";
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
  onCompletionDetected?: () => void; // New: called when AI signals completion
  autoConnect?: boolean;
  showTranscript?: boolean;
  showControls?: boolean; // New: control visibility of buttons
  showStopButton?: boolean; // New: show stop button during conversation
  showReadyPrompt?: boolean; // New: show "Sono pronto" prompt until first AI message
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

// Check if AI is signaling completion (before JSON is generated)
function isCompletionPhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  const completionPhrases = [
    "sto generando",
    "sto creando il tuo",
    "sto creando il tuo digital twin",
    "sto creando il tuo twin",
    "abbiamo finito",
    "abbiamo tutte le informazioni",
    "tutte le informazioni necessarie",
    "perfetto! abbiamo finito",
  ];
  return completionPhrases.some((phrase) => lowerText.includes(phrase));
}

export function VoiceAgent({
  systemPrompt,
  onTranscriptUpdate,
  onProfileDetected,
  onConnectionChange,
  onSilenceTimeout,
  onCompletionDetected,
  autoConnect = false,
  showTranscript = true,
  showControls = true,
  showStopButton = false,
  showReadyPrompt = false,
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
  const [hasReceivedFirstMessage, setHasReceivedFirstMessage] = useState(false);

  const clientRef = useRef<RealtimeClient | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const hasInitiatedRef = useRef(false);
  const mountedRef = useRef(true);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const profileDetectedRef = useRef(false);
  const completionDetectedRef = useRef(false);
  const fullTranscriptTextRef = useRef<string>(""); // Accumulate all text

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
    if (
      profileDetectedRef.current ||
      completionDetectedRef.current ||
      !mountedRef.current
    )
      return;

    // Start countdown display when 10 seconds remain
    const warningTime = Math.max(0, SILENCE_TIMEOUT_SECONDS - 10);

    // Set warning countdown
    setTimeout(() => {
      if (
        !mountedRef.current ||
        profileDetectedRef.current ||
        completionDetectedRef.current
      )
        return;

      let remaining = 10;
      setSilenceCountdown(remaining);

      countdownIntervalRef.current = setInterval(() => {
        remaining--;
        if (
          remaining <= 0 ||
          !mountedRef.current ||
          profileDetectedRef.current ||
          completionDetectedRef.current
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
      if (
        mountedRef.current &&
        !profileDetectedRef.current &&
        !completionDetectedRef.current
      ) {
        console.log("Silence timeout reached");
        disconnect();
        onSilenceTimeout?.();
      }
    }, SILENCE_TIMEOUT_SECONDS * 1000);
  }, [onSilenceTimeout, disconnect]);

  // Check for JSON profile in accumulated transcript
  const checkForProfile = useCallback(
    (fullText: string) => {
      // Look for JSON block in the accumulated text
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
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
            return true;
          }
        } catch {
          // Not valid JSON yet, might be partial
        }
      }
      return false;
    },
    [onProfileDetected, disconnect]
  );

  // Check for completion phrases
  const checkForCompletion = useCallback(
    (text: string) => {
      if (
        !completionDetectedRef.current &&
        !profileDetectedRef.current &&
        isCompletionPhrase(text)
      ) {
        completionDetectedRef.current = true;
        console.log("Completion phrase detected:", text);

        // Give a small delay for the JSON to arrive, then check
        setTimeout(() => {
          if (!profileDetectedRef.current && mountedRef.current) {
            // Check accumulated transcript for JSON
            const found = checkForProfile(fullTranscriptTextRef.current);
            if (!found) {
              // If no JSON found yet, call completion callback
              disconnect();
              onCompletionDetected?.();
            }
          }
        }, 2000); // Wait 2 seconds for JSON
      }
    },
    [checkForProfile, disconnect, onCompletionDetected]
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

      // Accumulate full text for JSON detection
      fullTranscriptTextRef.current += " " + text;

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
        // Mark that we've received the first AI message
        if (!hasReceivedFirstMessage) {
          setHasReceivedFirstMessage(true);
        }

        // First check if there's a JSON profile
        const found = checkForProfile(fullTranscriptTextRef.current);
        // If not, check for completion phrase
        if (!found) {
          checkForCompletion(text);
        }
      }
    },
    [onTranscriptUpdate, checkForProfile, checkForCompletion, resetSilenceTimer]
  );

  const connect = useCallback(async () => {
    if (isConnecting || isConnected || clientRef.current) {
      console.log("Already connected or connecting, skipping");
      return;
    }

    setIsConnecting(true);
    setError(null);
    profileDetectedRef.current = false;
    completionDetectedRef.current = false;
    fullTranscriptTextRef.current = "";
    setHasReceivedFirstMessage(false);

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
      {/* Ready Prompt Modal - Show when connected but no AI message yet */}
      {showReadyPrompt && isConnected && !hasReceivedFirstMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Inizia quando sei pronto
            </h3>
            <p className="text-muted-foreground mb-4">
              Pronuncia{" "}
              <strong className="text-foreground">
                &quot;Sono pronto&quot;
              </strong>{" "}
              quando vuoi iniziare l&apos;intervista
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Microfono attivo</span>
            </div>
          </div>
        </div>
      )}

      {/* Audio Visualizer - only shows interaction when speaking */}
      <div className="relative flex items-center justify-center mb-6">
        <AudioVisualizer
          isActive={isConnected}
          isSpeaking={isSpeaking}
          size={180}
        />

        {/* Stop button in center (when connected and showStopButton is true) */}
        {showStopButton && isConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              variant="destructive"
              onClick={disconnect}
              className="gap-2 rounded-full w-16 h-16 p-0"
              title="Interrompi"
            >
              <StopCircle className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Start button below visualizer (only when not connected and controls visible) */}
      {showControls && !isConnected && (
        <Button
          size="lg"
          onClick={connect}
          disabled={isConnecting}
          className="gap-2"
        >
          <Phone className="w-5 h-5" />
          Avvia Conversazione
        </Button>
      )}

      {/* Status */}
      <div className="text-center">
        {isConnecting && (
          <p className="text-white animate-pulse">Connessione in corso...</p>
        )}

        {isConnected && !isSpeaking && (
          <p className="text-white flex items-center gap-2 justify-center">
            <Mic className="w-4 h-4 text-green-500" />
            In ascolto...
          </p>
        )}
        {isConnected && isSpeaking && (
          <p className="text-white flex items-center gap-2 justify-center">
            <MicOff className="w-4 h-4 text-amber-500" />
            L&apos;AI sta parlando...
          </p>
        )}

        {error && <p className="text-destructive">{error}</p>}
      </div>

      {/* Live Transcript Preview (optional) - uses filtered displayTranscript */}
      {showTranscript && displayTranscript.length > 0 && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3 text-white">
              Trascrizione
            </h4>
            <div className="space-y-3">
              {displayTranscript.slice(-5).map((entry, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    entry.role === "user"
                      ? "text-foreground"
                      : "text-white italic"
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
