import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestOtpRequest, RequestOtpResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: RequestOtpRequest = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug richiesto" } as RequestOtpResponse,
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Find the twin by slug
    const { data: twin, error: twinError } = await supabase
      .from("twins")
      .select("id, email, display_name,slug")
      .eq("slug", slug.toLowerCase())
      .single();

    if (twinError || !twin) {
      return NextResponse.json(
        { success: false, error: "Twin non trovato" } as RequestOtpResponse,
        { status: 404 }
      );
    }

    if (!twin.email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Questo twin non ha un'email associata. Impossibile procedere con la modifica.",
        } as RequestOtpResponse,
        { status: 400 }
      );
    }

    // 2. Rate limiting: Check if there are recent OTP requests (prevent spam)
    const MINUTES = 0;
    const tenMinutesAgo = new Date(
      Date.now() - MINUTES * 60 * 1000
    ).toISOString();
    const { data: recentSessions, error: recentError } = await supabase
      .from("twin_edit_sessions")
      .select("id")
      .eq("twin_id", twin.id)
      .gte("created_at", tenMinutesAgo);

    if (recentError) {
      console.error("Error checking recent sessions:", recentError);
    }

    if (recentSessions && recentSessions.length >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Troppi tentativi. Riprova tra 10 minuti.",
        } as RequestOtpResponse,
        { status: 429 }
      );
    }

    // 3. Send OTP via Supabase Auth (Supabase will generate the OTP)
    // We DON'T generate a custom OTP because Supabase ignores it
    console.log("📧 Requesting OTP from Supabase for:", twin.email);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: twin.email,
        options: {
          // Redirect URL after clicking magic link
          emailRedirectTo: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/auth/callback`,
          data: {
            twin_name: twin.display_name,
            twin_slug: twin.slug,
          },
          shouldCreateUser: true,
        },
      });

      if (authError) {
        console.error("❌ Supabase Auth OTP error:", authError);
        return NextResponse.json(
          {
            success: false,
            error: "Errore nell'invio dell'email. Riprova.",
          } as RequestOtpResponse,
          { status: 500 }
        );
      }

      console.log("✅ OTP sent successfully via Supabase Auth");
      console.log("ℹ️ Supabase will generate and send the OTP token");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Errore nell'invio dell'email",
        } as RequestOtpResponse,
        { status: 500 }
      );
    }

    // 4. Create edit session in database (without OTP token - Supabase manages it)
    const { data: session, error: sessionError } = await supabase
      .from("twin_edit_sessions")
      .insert({
        twin_id: twin.id,
        email: twin.email,
        otp_token: "SUPABASE_MANAGED", // Placeholder - actual verification happens via Supabase Auth
        verified: false,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("Error creating edit session:", sessionError);
      return NextResponse.json(
        {
          success: false,
          error: "Errore nella creazione della sessione",
        } as RequestOtpResponse,
        { status: 500 }
      );
    }

    console.log("📝 Session created:", session.id, "(OTP managed by Supabase)");

    // 5. Return success with session ID
    return NextResponse.json({
      success: true,
      sessionId: session.id,
    } as RequestOtpResponse);
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server",
      } as RequestOtpResponse,
      { status: 500 }
    );
  }
}
