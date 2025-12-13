"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";

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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VoiceAgent, type TranscriptEntry } from "@/components/voice-agent";
import { InterviewProgress } from "@/components/interview-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateInterviewerPrompt } from "@/lib/prompts";
import {
  TOTAL_FIXED_QUESTIONS,
  MAX_TOTAL_QUESTIONS,
  SILENCE_TIMEOUT_SECONDS,
} from "@/lib/constants";
import {
  ArrowLeft,
  Check,
  Loader2,
  LinkIcon,
  MessageSquare,
} from "lucide-react";
import { createDefaultProfile, type TwinProfile } from "@/lib/supabase/client";
import type { PortfolioInfo, PreInterviewData } from "@/lib/types";

type CreateState =
  | "loading"
  | "intro"
  | "interviewing"
  | "saving"
  | "success"
  | "error";

export default function CreatePage() {
  const router = useRouter();
  const [state, setState] = useState<CreateState>("loading");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isDeepening, setIsDeepening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptRef = useRef<TranscriptEntry[]>([]); // Ref to always have latest transcript
  const [error, setError] = useState<string | null>(null);

  // Pre-interview data
  const [preData, setPreData] = useState<PreInterviewData | null>(null);
  const [portfolioInfo, setPortfolioInfo] = useState<PortfolioInfo | null>(
    null
  );

  // Load pre-interview data on mount
  useEffect(() => {
    const preDataStr = sessionStorage.getItem("preInterviewData");
    const portfolioInfoStr = sessionStorage.getItem("portfolioInfo");

    if (!preDataStr) {
      // No pre-data, redirect to home
      router.push("/");
      return;
    }

    try {
      const data: PreInterviewData = JSON.parse(preDataStr);
      setPreData(data);

      if (portfolioInfoStr) {
        setPortfolioInfo(JSON.parse(portfolioInfoStr));
      }

      setState("intro");
    } catch {
      router.push("/");
    }
  }, [router]);

  // Generate interviewer prompt with portfolio context and documents
  const interviewerPrompt = useMemo(() => {
    return generateInterviewerPrompt(portfolioInfo, preData?.documents);
  }, [portfolioInfo, preData?.documents]);

  // Filter transcript for display (hide JSON blocks)
  const displayTranscript = useMemo(() => {
    return transcript
      .map((entry) => {
        if (entry.role === "assistant") {
          const filtered = filterJsonFromText(entry.text);
          if (!filtered) return null; // Skip empty entries after filtering
          return { ...entry, text: filtered };
        }
        return entry;
      })
      .filter(Boolean) as TranscriptEntry[];
  }, [transcript]);

  // Start interview
  const startInterview = useCallback(() => {
    setState("interviewing");
  }, []);

  // Track question progress
  const handleTranscriptUpdate = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries);
    transcriptRef.current = entries; // Keep ref updated for callbacks
    const assistantMessages = entries.filter(
      (e) => e.role === "assistant"
    ).length;
    const questionNum = Math.min(assistantMessages, MAX_TOTAL_QUESTIONS);
    setCurrentQuestion(questionNum);
    setIsDeepening(assistantMessages > TOTAL_FIXED_QUESTIONS);
  }, []);

  // Handle profile detection - save and redirect
  const handleProfileDetected = useCallback(
    async (profile: unknown) => {
      if (!preData) return;

      setState("saving");

      try {
        // Normalize profile with fallbacks
        const twinProfile = profile as Partial<TwinProfile>;
        const normalizedProfile: TwinProfile = {
          identity_summary: twinProfile.identity_summary || "-",
          thinking_patterns: twinProfile.thinking_patterns || "-",
          methodology: twinProfile.methodology || "-",
          constraints: twinProfile.constraints || "-",
          proof_metrics: twinProfile.proof_metrics || "-",
          style_tone: twinProfile.style_tone || "-",
          do_not_say: Array.isArray(twinProfile.do_not_say)
            ? twinProfile.do_not_say
            : [],
        };

        // Build full transcript from ref (always latest)
        const fullTranscript = transcriptRef.current
          .map(
            (entry) =>
              `${entry.role === "user" ? "UTENTE" : "AI"}: ${entry.text}`
          )
          .join("\n\n");

        // Get display name from portfolio or generate from slug
        const displayName =
          portfolioInfo?.name ||
          preData.slug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        // Save twin
        const saveResponse = await fetch("/api/twins/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: preData.slug,
            displayName,
            email: preData.email,
            profile: normalizedProfile,
            transcript: fullTranscript,
            documents: preData.documents,
            portfolioInfo: portfolioInfo,
          }),
        });

        const saveResult = await saveResponse.json();

        if (!saveResult.success) {
          throw new Error(saveResult.error || "Errore nel salvataggio");
        }

        // Clear session data
        sessionStorage.removeItem("preInterviewData");
        sessionStorage.removeItem("portfolioInfo");

        // Redirect to twin page
        setState("success");
        setTimeout(() => {
          router.push(`/t/${saveResult.twin.slug}`);
        }, 2000);
      } catch (err) {
        console.error("Error saving twin:", err);
        // Try to save with minimal data as fallback
        await saveWithFallback();
      }
    },
    [preData, portfolioInfo, router]
  );

  // Fallback save with minimal data
  const saveWithFallback = useCallback(async () => {
    if (!preData) {
      setError("Dati mancanti. Riprova.");
      setState("error");
      return;
    }

    try {
      // Use ref for latest transcript
      const fullTranscript = transcriptRef.current
        .map(
          (entry) => `${entry.role === "user" ? "UTENTE" : "AI"}: ${entry.text}`
        )
        .join("\n\n");

      const saveResponse = await fetch("/api/twins/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: preData.slug,
          email: preData.email,
          profile: createDefaultProfile(),
          transcript: fullTranscript || "-",
          documents: preData.documents,
        }),
      });

      const saveResult = await saveResponse.json();

      if (saveResult.success) {
        sessionStorage.removeItem("preInterviewData");
        sessionStorage.removeItem("portfolioInfo");
        setState("success");
        setTimeout(() => {
          router.push(`/t/${saveResult.twin.slug}`);
        }, 2000);
      } else {
        throw new Error(saveResult.error);
      }
    } catch (err) {
      console.error("Fallback save error:", err);
      setError("Errore nel salvataggio. Riprova.");
      setState("error");
    }
  }, [preData, router]);

  // Retry from error
  const handleRetry = useCallback(() => {
    if (preData) {
      setState("interviewing");
    } else {
      router.push("/");
    }
  }, [preData, router]);

  // Handle silence timeout - redirect to home (don't create twin)
  const handleSilenceTimeout = useCallback(() => {
    console.log("Silence timeout - redirecting to home");
    sessionStorage.removeItem("preInterviewData");
    sessionStorage.removeItem("portfolioInfo");
    router.push("/");
  }, [router]);

  // Handle completion detected (AI said completion phrase but no JSON yet)
  const handleCompletionDetected = useCallback(async () => {
    console.log("Completion detected - saving with fallback profile");
    setState("saving");
    await saveWithFallback();
  }, [saveWithFallback]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-radial-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

          {/* Show slug badge */}
          {preData && (
            <div className="text-sm text-white">
              <span className="font-mono bg-muted px-2 py-1 rounded">
                /t/{preData.slug}
              </span>
            </div>
          )}
        </div>

        {/* Intro State */}
        {state === "intro" && preData && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto per l&apos;intervista
            </h1>
            <p className="text-lg text-white mb-8">
              Ora parlerai con l&apos;AI che ti farà alcune domande per creare
              il tuo Digital Twin. Quando sei pronto, di&apos;{" "}
              <strong>&quot;Sono pronto&quot;</strong> per iniziare.
            </p>

            {portfolioInfo?.name && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <LinkIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">
                  Ciao {portfolioInfo.name}!
                </span>
              </div>
            )}

            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Come interagire al meglio con l&apos;AI
                </h3>
                <ul className="text-sm text-white space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong>Usa esempi concreti:</strong> L&apos;AI
                      approfondirà le risposte più specifiche e dettagliate
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong>Chiedi chiarimenti:</strong> Se qualcosa non ti è
                      chiaro, chiedi pure. L&apos;AI è qui per aiutarti
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong>Parla naturalmente:</strong> Rispondi come in una
                      conversazione normale, senza formalismi
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong>Sii te stesso:</strong> L&apos;obiettivo è
                      catturare la tua personalità autentica
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600">
                <strong>Importante:</strong> Di&apos; &quot;Sono pronto&quot;
                per iniziare l&apos;intervista. Se rimani in silenzio per{" "}
                {SILENCE_TIMEOUT_SECONDS} secondi, la conversazione terminerà
                automaticamente.
              </p>
            </div>

            <Button size="lg" onClick={startInterview} className="gap-2">
              Inizia l&apos;intervista
            </Button>
          </div>
        )}

        {/* Interviewing State */}
        {state === "interviewing" && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-6">Intervista in corso</h1>
                <InterviewProgress
                  currentQuestion={currentQuestion}
                  isDeepening={isDeepening}
                />
              </div>

              <VoiceAgent
                systemPrompt={interviewerPrompt}
                onTranscriptUpdate={handleTranscriptUpdate}
                onProfileDetected={handleProfileDetected}
                onSilenceTimeout={handleSilenceTimeout}
                onCompletionDetected={handleCompletionDetected}
                autoConnect={true}
                showTranscript={false}
                showControls={false}
                showReadyPrompt={true}
              />
            </div>

            {/* Transcript sidebar */}
            <div className="hidden lg:block w-96 shrink-0">
              <div className="sticky top-8">
                <h3 className="text-sm font-medium mb-3 text-white">
                  Trascrizione
                </h3>
                <div className="bg-card border border-border rounded-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {displayTranscript.length === 0 ? (
                    <p className="text-sm text-white italic">
                      Quando sei pronto, di&apos; &quot;Sono pronto&quot;
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {displayTranscript.map((entry, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg text-sm ${
                            entry.role === "user"
                              ? "bg-primary/10 text-foreground"
                              : "bg-muted text-white"
                          }`}
                        >
                          <span className="font-medium block mb-1 text-xs uppercase tracking-wide opacity-60">
                            {entry.role === "user" ? "Tu" : "AI"}
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

        {/* Saving State */}
        {state === "saving" && (
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Salvataggio in corso...</h2>
            <p className="text-white">Stiamo creando il tuo Digital Twin.</p>
          </div>
        )}

        {/* Success State */}
        {state === "success" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Complimenti!</h2>
            <p className="text-white mb-4">
              Il tuo Digital Twin è stato creato con successo.
            </p>
            <p className="text-sm text-white">Reindirizzamento in corso...</p>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">!</span>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Si è verificato un errore
            </h2>
            <p className="text-white mb-6">
              {error || "Qualcosa è andato storto."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRetry}>Riprova</Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Torna alla home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
