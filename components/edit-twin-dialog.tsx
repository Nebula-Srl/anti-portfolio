"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface EditTwinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  twinSlug: string;
  twinEmail?: string;
  onOtpSent: (sessionId: string) => void;
}

export function EditTwinDialog({
  open,
  onOpenChange,
  twinSlug,
  twinEmail,
  onOtpSent,
}: EditTwinDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirm, setEmailConfirm] = useState("");

  const handleRequestOtp = async () => {
    if (!twinEmail) {
      const errorMsg = "Questo profilo non ha un'email associata.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (emailConfirm.toLowerCase() !== twinEmail.toLowerCase()) {
      const errorMsg = "L'email inserita non corrisponde.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twins/edit/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: twinSlug }),
      });

      const data = await response.json();

      if (data.success && data.sessionId) {
        toast.success("📧 Codice OTP inviato! Controlla la tua email.", {
          autoClose: 5000,
        });
        // Don't close modal, just trigger next step
        onOtpSent(data.sessionId);
      } else {
        const errorMsg = data.error || "Errore nell'invio del codice";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Errore di connessione";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!twinEmail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Profilo Non Disponibile</DialogTitle>
            <DialogDescription>
              Questo profilo non ha un&apos;email associata e non può essere
              modificato.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica il tuo Profilo</DialogTitle>
          <DialogDescription>
            Per sicurezza, conferma la tua email, che hai inserito nel profilo.
            Ti invieremo un codice di verifica per poter modificare il profilo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email-confirm" className="text-sm font-medium">
              Conferma email
            </label>
            <Input
              id="email-confirm"
              type="email"
              placeholder="Inserisci la tua email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && emailConfirm) {
                  handleRequestOtp();
                }
              }}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleRequestOtp}
            disabled={loading || !emailConfirm}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : (
              "Invia Codice OTP"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annulla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
