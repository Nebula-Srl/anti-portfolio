"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check } from "lucide-react";
import { toast } from "react-toastify";
import { Twin } from "@/lib/supabase/client";

interface OtpVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onVerified: (editToken: string, twin: Twin) => void;
  onResendOtp: () => void;
}

const OTP_LENGTH = 6;

export function OtpVerification({
  open,
  onOpenChange,
  sessionId,
  onVerified,
  onResendOtp,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(900); // 15 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Auto-focus first input when opened
  useEffect(() => {
    if (open) {
      inputRefs.current[0]?.focus();
    }
  }, [open]);

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (value && index === OTP_LENGTH - 1 && newOtp.every((d) => d)) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    console.log("📋 Pasted OTP:", pastedData, "Length:", pastedData.length);

    // Extract only digits from pasted data (in case there are spaces or other chars)
    const digitsOnly = pastedData.replace(/\D/g, "");

    console.log("🔢 Digits only:", digitsOnly, "Length:", digitsOnly.length);

    // Only accept 6 digits
    if (digitsOnly.length === 6) {
      const newOtp = digitsOnly.split("");
      setOtp(newOtp);
      setError(null);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(digitsOnly);
    } else {
      toast.error(
        `OTP deve essere di 6 cifre (ricevuto: ${digitsOnly.length})`
      );
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");

    if (code.length !== OTP_LENGTH) {
      const errorMsg = "Inserisci tutte le 6 cifre";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log("🔐 Verifying OTP:", code, "for session:", sessionId);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twins/edit/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: code }),
      });

      const data = await response.json();
      console.log("📨 Verify response:", data);

      if (data.success && data.editToken) {
        toast.success("✅ Codice verificato! Accesso al profilo consentito.", {
          autoClose: 3000,
        });
        onVerified(data.editToken, data.twin);
      } else {
        const errorMsg = data.error || "Codice non valido";
        setError(errorMsg);
        toast.error(errorMsg);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const errorMsg = "Errore di connessione";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(null);
    setCountdown(900);
    onResendOtp();
    inputRefs.current[0]?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verifica Codice OTP</DialogTitle>
          <DialogDescription>
            Inserisci il codice a 6 cifre inviato alla tua email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`
                  w-12 h-14 text-center text-2xl font-bold rounded-lg
                  border-2 transition-all
                  ${digit ? "border-primary" : "border-input"}
                  ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary/50"
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary
                  bg-background
                `}
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {countdown > 0 ? (
                <>
                  Codice valido per{" "}
                  <span className="font-mono font-semibold">
                    {formatCountdown()}
                  </span>
                </>
              ) : (
                <span className="text-destructive">Codice scaduto</span>
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {/* Success message */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Verifica in corso...</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleVerify()}
            disabled={loading || otp.some((d) => !d)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifica...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Verifica Codice
              </>
            )}
          </Button>

          <Button variant="ghost" onClick={handleResend} disabled={loading}>
            Reinvia Codice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
