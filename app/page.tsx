"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic,
  Share2,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  Mail,
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { SLUG_REGEX } from "@/lib/constants";
import type { DocumentRef } from "@/lib/supabase/client";
import type { PreInterviewData } from "@/lib/types";
import { toast } from "react-toastify";

export default function LandingPage() {
  const router = useRouter();
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal form state
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [documents, setDocuments] = useState<DocumentRef[]>([]);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal form
  const resetModalForm = useCallback(() => {
    setSlug("");
    setEmail("");
    setDocuments([]);
    setSlugError(null);
    setEmailError(null);
    setIsUploading(false);
    setIsValidating(false);
    setIsCheckingSlug(false);
    setIsCheckingEmail(false);
  }, []);

  // Validate slug format
  const validateSlug = useCallback((value: string): string | null => {
    if (!value || value.length < 3) return "Minimo 3 caratteri";
    if (value.length > 30) return "Massimo 30 caratteri";
    if (!SLUG_REGEX.test(value))
      return "Solo lettere minuscole, numeri e trattini";
    return null;
  }, []);

  // Validate email format
  const validateEmail = useCallback((value: string): string | null => {
    if (!value) return "Email richiesta";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Email non valida";
    return null;
  }, []);

  // Handle slug change
  const handleSlugChange = useCallback((value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(normalized);
    // Don't validate immediately, only normalize
  }, []);

  // Handle email change
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    // Don't validate immediately
  }, []);

  // Check slug availability on blur
  const handleSlugBlur = useCallback(async () => {
    const formatError = validateSlug(slug);
    if (formatError) {
      setSlugError(formatError);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const response = await fetch("/api/twins/validate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const result = await response.json();
      if (!result.valid) {
        setSlugError(result.error || "Nome non disponibile");
      } else {
        setSlugError(null);
      }
    } catch {
      setSlugError("Errore di connessione");
    }
    setIsCheckingSlug(false);
  }, [slug, validateSlug]);

  // Check email availability on blur
  const handleEmailBlur = useCallback(async () => {
    const formatError = validateEmail(email);
    if (formatError) {
      setEmailError(formatError);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch("/api/twins/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!result.valid) {
        setEmailError(result.error || "Email non disponibile");
      } else {
        setEmailError(null);
      }
    } catch {
      setEmailError("Errore di connessione");
    }
    setIsCheckingEmail(false);
  }, [email, validateEmail]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !slug) return;

      setIsUploading(true);

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("slug", slug);

          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            setDocuments((prev) => [...prev, data.document]);
          }
        } catch (err) {
          console.error("Upload error:", err);
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [slug]
  );

  // Remove document
  const removeDocument = useCallback((index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Open modal and start analysis
  const handleOpenModal = useCallback(async () => {
    if (!portfolioUrl.trim()) {
      toast.error("Link al portfolio richiesto");
      return;
    }
    // Reset form first
    resetModalForm();

    setShowModal(true);

    // If portfolio URL provided, analyze it
    if (portfolioUrl.trim()) {
      setIsAnalyzing(true);
      try {
        const response = await fetch("/api/portfolio/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: portfolioUrl.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          // Pre-fill slug from name if available
          if (data.info?.name) {
            const suggestedSlug = data.info.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 30);
            setSlug(suggestedSlug);
          }
          // Store portfolio info in sessionStorage for later
          sessionStorage.setItem("portfolioInfo", JSON.stringify(data.info));
        }
      } catch (err) {
        console.error("Analysis error:", err);
      }
      setIsAnalyzing(false);
    }
  }, [portfolioUrl, resetModalForm]);

  // Submit and go to interview
  const handleSubmit = useCallback(async () => {
    // Validate
    const slugErr = validateSlug(slug);
    const emailErr = validateEmail(email);

    if (slugErr) {
      setSlugError(slugErr);
      return;
    }
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setIsValidating(true);

    // Check slug availability
    try {
      const response = await fetch("/api/twins/validate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const result = await response.json();

      if (!result.valid) {
        setSlugError(result.error || "Nome non disponibile");
        setIsValidating(false);
        return;
      }

      // Store pre-interview data
      const preInterviewData: PreInterviewData = {
        slug: result.slug,
        email,
        portfolioUrl: portfolioUrl.trim() || undefined,
        documents,
      };

      sessionStorage.setItem(
        "preInterviewData",
        JSON.stringify(preInterviewData)
      );

      // Navigate to create page
      router.push("/create");
    } catch (err) {
      console.error("Validation error:", err);
      setSlugError("Errore di connessione. Riprova.");
      setIsValidating(false);
    }
  }, [
    slug,
    email,
    portfolioUrl,
    documents,
    validateSlug,
    validateEmail,
    router,
  ]);

  const isFormValid =
    slug.length >= 3 &&
    !slugError &&
    email &&
    !emailError &&
    !isValidating &&
    !isCheckingSlug &&
    !isCheckingEmail;

  return (
    <div className="min-h-screen bg-radial-gradient">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      <main className="relative z-10">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Powered by <strong>Salvatore Campagnese</strong>
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Crea il tuo <span className="gradient-text">Digital Twin</span>
            </h1>

            <p className="text-lg md:text-xl text-white max-w-2xl mx-auto mb-10">
              Un&apos;intervista vocale con l&apos;AI cattura la tua essenza. Il
              tuo twin risponde per te, condivisibile con chiunque tramite un
              link unico.
            </p>

            <div className="max-w-md mx-auto space-y-4 mb-6">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
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
                onClick={handleOpenModal}
                className="w-full text-lg h-14 rounded-xl gap-2 animate-glow"
              >
                <Mic className="w-5 h-5" />
                Crea il tuo Twin
              </Button>
            </div>

            <p className="text-sm text-white italic">
              10 minuti di intervista • Nessuna registrazione richiesta • Gratis
            </p>
          </div>

          {/* How it works section */}
          <div className="mt-32 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">
              Come funziona
            </h2>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Mic className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Intervista Vocale
                  </h3>
                  <p className="text-white">
                    Parla con l&apos;AI che ti fa domande approfondite su chi
                    sei.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Creazione Twin</h3>
                  <p className="text-white">
                    L&apos;AI elabora le tue risposte e crea il tuo profilo.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Share2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Condividi</h3>
                  <p className="text-white">
                    Ottieni un link unico per condividere il tuo twin.
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
                <p className="text-white text-sm">
                  Permetti ai recruiter di parlare con te prima di un colloquio.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Portfolio Creativo
                </h3>
                <p className="text-white text-sm">
                  Aggiungi una dimensione interattiva al tuo portfolio.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Personal Branding
                </h3>
                <p className="text-white text-sm">
                  Crea una versione di te sempre disponibile.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <MessageSquare className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Networking</h3>
                <p className="text-white text-sm">
                  Condividi il tuo twin dopo un evento.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-white">
            <p>
              Digital Twin Portfolio • Creato da{" "}
              <strong>Salvatore Campagnese</strong>
            </p>
          </div>
        </footer>
      </main>

      {/* Pre-Interview Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          // Only allow closing via the "Annulla" button, not by clicking outside
          if (!open && !isValidating && !isAnalyzing) {
            setShowModal(false);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Configura il tuo Digital Twin</DialogTitle>
            <DialogDescription>
              Inserisci le informazioni per creare il tuo twin. Potrai
              modificarle in seguito.
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-white">Analisi portfolio in corso...</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Slug */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome del Twin *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm shrink-0">twin.app/</span>
                  <div className="relative flex-1">
                    <Input
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      onBlur={handleSlugBlur}
                      placeholder="mario-rossi"
                      className={`font-mono ${
                        slugError ? "border-destructive" : ""
                      }`}
                      maxLength={30}
                    />
                    {isCheckingSlug && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white" />
                    )}
                  </div>
                </div>
                {slugError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {slugError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="tu@esempio.com"
                    className={`pl-10 pr-10 ${
                      emailError ? "border-destructive" : ""
                    }`}
                  />
                  {isCheckingEmail && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white" />
                  )}
                </div>
                {emailError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
                <p className="text-xs text-white mt-2">
                  Nessuna newsletter. Serve solo per modificare il tuo twin in
                  futuro.
                </p>
              </div>

              {/* Documents */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Documento (opzionale)
                </label>
                <p className="text-xs text-white mb-3">
                  Carica CV, portfolio PDF o altri documenti per arricchire il
                  tuo profilo.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={!slug || slug.length < 3}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    !slug ||
                    slug.length < 3 ||
                    isUploading ||
                    documents.length >= 1
                  }
                  className="w-full gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "Caricamento..." : "Carica documento"}
                </Button>

                {slug.length < 3 && (
                  <p className="text-xs text-white mt-2">
                    Inserisci prima il nome del twin per caricare documento.
                  </p>
                )}

                {/* Uploaded documents list */}
                {documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {documents.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                      >
                        <FileText className="w-4 h-4 text-white shrink-0" />
                        <span className="flex-1 truncate">{doc.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(i)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetModalForm();
                setShowModal(false);
              }}
              disabled={isValidating}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isAnalyzing}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifica...
                </>
              ) : (
                "Inizia intervista"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
