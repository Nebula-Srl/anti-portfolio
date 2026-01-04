import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyEditToken } from "@/lib/auth";
import OpenAI from "openai";
import type { VoiceUpdateRequest, VoiceUpdateResponse } from "@/lib/types";
import type { TwinProfile } from "@/lib/supabase/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body: VoiceUpdateRequest = await request.json();
    const { editToken, twinId, transcript, section } = body;

    if (!editToken || !twinId || !transcript) {
      return NextResponse.json(
        { success: false, error: "Token, Twin ID e transcript richiesti" } as VoiceUpdateResponse,
        { status: 400 }
      );
    }

    // 1. Verify JWT token
    const tokenPayload = verifyEditToken(editToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Token non valido o scaduto" } as VoiceUpdateResponse,
        { status: 401 }
      );
    }

    // 2. Verify token matches twin ID
    if (tokenPayload.twinId !== twinId) {
      return NextResponse.json(
        { success: false, error: "Token non autorizzato per questo twin" } as VoiceUpdateResponse,
        { status: 403 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 3. Get current twin profile
    const { data: twin, error: fetchError } = await supabase
      .from("twins")
      .select("profile_json")
      .eq("id", twinId)
      .single();

    if (fetchError || !twin) {
      return NextResponse.json(
        { success: false, error: "Twin non trovato" } as VoiceUpdateResponse,
        { status: 404 }
      );
    }

    const currentProfile = twin.profile_json as TwinProfile;

    // 4. Extract updated section from transcript using GPT
    const extractionPrompt = section
      ? `Analizza questa conversazione vocale e estrai il contenuto aggiornato per la sezione "${section}" del profilo.

CONVERSAZIONE:
${transcript}

PROFILO ATTUALE - ${section}:
${currentProfile[section]}

Genera il nuovo testo per questa sezione, integrando le nuove informazioni dalla conversazione con quelle esistenti.
Scrivi in italiano, in prima persona (implicita), 2-3 frasi complete.

Rispondi SOLO in formato JSON:
{
  "updated_section": "${section}",
  "updated_value": "Il testo aggiornato qui..."
}`
      : `Analizza questa conversazione vocale e aggiorna il profilo completo.

CONVERSAZIONE:
${transcript}

PROFILO ATTUALE:
${JSON.stringify(currentProfile, null, 2)}

Genera il profilo aggiornato completo, integrando le nuove informazioni dalla conversazione.
Mantieni lo stesso formato e stile, scrivi in italiano, in prima persona (implicita).

Rispondi in formato JSON con il profilo completo aggiornato.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Sei un esperto nell'analisi di conversazioni e nell'estrazione di informazioni strutturate per profili professionali. Rispondi sempre in formato JSON.",
        },
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "Errore nell'estrazione" } as VoiceUpdateResponse,
        { status: 500 }
      );
    }

    // 5. Parse and update profile
    const parsed = JSON.parse(responseText);
    let updatedProfile: TwinProfile;

    if (section && parsed.updated_section && parsed.updated_value) {
      // Update single section
      updatedProfile = {
        ...currentProfile,
        [section]: parsed.updated_value,
      };
    } else {
      // Full profile update
      updatedProfile = { ...currentProfile, ...parsed };
    }

    // 6. Return updated profile (actual DB update will be done by update route)
    return NextResponse.json({
      success: true,
      updatedProfile,
    } as VoiceUpdateResponse);
  } catch (error) {
    console.error("Voice update error:", error);
    return NextResponse.json(
      { success: false, error: "Errore nell'aggiornamento vocale" } as VoiceUpdateResponse,
      { status: 500 }
    );
  }
}

