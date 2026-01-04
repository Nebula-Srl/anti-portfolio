import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sign } from "jsonwebtoken";
import type {
  VerifyOtpRequest,
  VerifyOtpResponse,
  EditTokenPayload,
} from "@/lib/types";

const JWT_SECRET =
  process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production";

export async function POST(request: Request) {
  try {
    const body: VerifyOtpRequest = await request.json();
    const { sessionId, otp } = body;
    console.log("🔍 Verify OTP request:", body);
    if (!sessionId || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID e OTP richiesti",
        } as VerifyOtpResponse,
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "OTP non valido" } as VerifyOtpResponse,
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Find the edit session
    const { data: session, error: sessionError } = await supabase
      .from("twin_edit_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    console.log("🔍 Verifying OTP - Session:", sessionId);
    console.log("🔍 Session email:", session?.email);

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Sessione non trovata" } as VerifyOtpResponse,
        { status: 404 }
      );
    }

    // 2. Check if already verified
    if (session.verified) {
      return NextResponse.json(
        { success: false, error: "OTP già utilizzato" } as VerifyOtpResponse,
        { status: 400 }
      );
    }

    // 3. Check if expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP scaduto. Richiedi un nuovo codice.",
        } as VerifyOtpResponse,
        { status: 400 }
      );
    }

    // 4. Verify OTP with Supabase Auth (this is the only source of truth)
    console.log("🔐 Verifying OTP with Supabase Auth, email:", session.email);
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: session.email,
      token: otp,
      type: "email",
    });

    console.log("📧 Supabase Auth verification result:", {
      success: !!authData?.user,
      error: authError?.message,
    });

    if (authError || !authData?.user) {
      console.log("❌ Supabase verification failed");
      return NextResponse.json(
        {
          success: false,
          error: "OTP non corretto o scaduto",
        } as VerifyOtpResponse,
        { status: 401 }
      );
    }

    console.log("✅ Supabase Auth OTP verification successful");

    // 5. Mark session as verified
    const { error: updateError } = await supabase
      .from("twin_edit_sessions")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return NextResponse.json(
        { success: false, error: "Errore nella verifica" } as VerifyOtpResponse,
        { status: 500 }
      );
    }

    // 6. Get twin data
    const { data: twin, error: twinError } = await supabase
      .from("twins")
      .select("*")
      .eq("id", session.twin_id)
      .single();

    if (twinError || !twin) {
      return NextResponse.json(
        { success: false, error: "Twin non trovato" } as VerifyOtpResponse,
        { status: 404 }
      );
    }

    // 7. Generate JWT token (valid for 1 hour)
    const tokenPayload: EditTokenPayload = {
      sessionId: session.id,
      twinId: session.twin_id,
      email: session.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    const editToken = sign(tokenPayload, JWT_SECRET);

    // 8. Return success with token and twin data
    return NextResponse.json({
      success: true,
      editToken,
      twin,
    } as VerifyOtpResponse);
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server",
      } as VerifyOtpResponse,
      { status: 500 }
    );
  }
}
