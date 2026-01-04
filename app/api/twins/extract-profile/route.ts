import { NextResponse } from "next/server";
import { extractProfileFromTranscript } from "@/lib/openai/profile-extraction";
import type { DocumentRef } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, documents } = body as {
      transcript: string;
      documents?: DocumentRef[];
    };

    if (!transcript || transcript.length < 50) {
      return NextResponse.json(
        { error: "Trascrizione troppo breve o mancante" },
        { status: 400 }
      );
    }

    // Extract and combine document text
    let documentsText: string | null = null;
    if (documents && documents.length > 0) {
      const textParts = documents
        .filter((doc) => doc.extractedText)
        .map((doc) => `=== ${doc.name} ===\n${doc.extractedText}`);
      if (textParts.length > 0) {
        documentsText = textParts.join("\n\n");
      }
    }

    // Extract profile using GPT-4
    const profile = await extractProfileFromTranscript(
      transcript,
      documentsText
    );

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Profile extraction error:", error);
    return NextResponse.json(
      {
        error: "Errore durante l'estrazione del profilo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


