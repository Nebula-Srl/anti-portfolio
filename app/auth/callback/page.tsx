"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get hash parameters (Supabase returns them in hash)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        if (!accessToken || type !== "magiclink") {
          setError("Link non valido o scaduto");
          return;
        }

        // Decode JWT to get twin information
        const tokenParts = accessToken.split(".");
        if (tokenParts.length !== 3) {
          setError("Token non valido");
          return;
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        const twinSlug = payload.user_metadata?.twin_slug;
        const otpCode = payload.user_metadata?.otp_code;

        if (!twinSlug) {
          setError("Informazioni twin mancanti");
          return;
        }

        // Store OTP and session info for automatic verification
        sessionStorage.setItem("magic_link_otp", otpCode || "");
        sessionStorage.setItem("magic_link_slug", twinSlug);
        sessionStorage.setItem("magic_link_token", accessToken);
        sessionStorage.setItem("magic_link_timestamp", Date.now().toString());

        // Redirect to twin page
        router.push(`/t/${twinSlug}?edit=true`);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Errore nell'elaborazione del link");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Errore</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Verifica in corso...
        </h1>
        <p className="text-white/80">Ti stiamo reindirizzando al tuo profilo</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Caricamento...
            </h1>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
