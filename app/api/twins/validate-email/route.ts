import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate format
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { valid: false, error: "Email richiesta" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({
        valid: false,
        error: "Formato email non valido",
      });
    }

    // Check database uniqueness
    const supabase = createServerSupabaseClient();
    const { data: existing, error } = await supabase
      .from("twins")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { valid: false, error: "Errore di verifica. Riprova." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        valid: false,
        error: "Questa email è già associata a un twin.",
      });
    }

    return NextResponse.json({
      valid: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Errore di validazione" },
      { status: 500 }
    );
  }
}

