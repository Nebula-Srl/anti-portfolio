import OpenAI from "openai";
import type { TwinProfile } from "../supabase/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract profile from interview transcript using GPT-4
 * Used as fallback when the realtime AI doesn't generate the JSON
 */
export async function extractProfileFromTranscript(
  transcript: string,
  documentsText?: string | null
): Promise<TwinProfile> {
  const prompt = `Sei un esperto nell'analisi di interviste per creare profili cognitivi.

Analizza questa trascrizione di intervista e ESTRAI un profilo dettagliato.

TRASCRIZIONE:
${transcript}

${documentsText ? `DOCUMENTI CARICATI:\n${documentsText}\n` : ""}

COMPITO:
Genera un JSON con questo formato, compilando OGNI campo con informazioni dettagliate estratte dalla trascrizione:

{
  "identity_summary": "2-3 frasi: Chi è la persona? Ruolo, competenze, cosa fa. Basati su quello che ha detto.",
  "thinking_patterns": "2-3 frasi: Come ragiona quando risolve problemi? Approccio? Cosa considera importante?",
  "methodology": "2-3 frasi: Come lavora concretamente? Strumenti, processi, workflow?",
  "constraints": "1-2 frasi: Principi che segue, limiti, cosa evita di fare.",
  "proof_metrics": "1-3 frasi: Risultati concreti, progetti significativi, impatto misurabile. Usa info dai documenti se presenti.",
  "style_tone": "1-2 frasi: Come comunica? Formale/informale? Diretto? Usa esempi?",
  "do_not_say": ["Lista di 3-5 cose SPECIFICHE non menzionate da NON inventare: es. aziende, tecnologie, esperienze non dette"]
}

REGOLE IMPORTANTI:
1. Scrivi in ITALIANO, in prima persona implicita
2. Usa SOLO informazioni dalla trascrizione e documenti
3. Sii DETTAGLIATO - ogni campo deve avere frasi complete e specifiche
4. Se una sezione è poco coperta, scrivi quello che c'è comunque (non lasciare vuoto)
5. NON inventare, ma SINTETIZZA quello che la persona ha effettivamente detto
6. Rispondi SOLO con il JSON, nessun altro testo`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Sei un esperto nell'estrazione di profili cognitivi da interviste. Rispondi sempre SOLO con JSON valido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in GPT response");
    }

    const parsed = JSON.parse(content);
    
    // Validate and normalize
    const profile: TwinProfile = {
      identity_summary: parsed.identity_summary || "Profilo non disponibile",
      thinking_patterns: parsed.thinking_patterns || "Pattern di pensiero non specificati",
      methodology: parsed.methodology || "Metodologia non specificata",
      constraints: parsed.constraints || "Nessun vincolo specificato",
      proof_metrics: parsed.proof_metrics || "Metriche non disponibili",
      style_tone: parsed.style_tone || "Stile comunicativo non specificato",
      do_not_say: Array.isArray(parsed.do_not_say) ? parsed.do_not_say : [],
    };

    return profile;
  } catch (error) {
    console.error("Error extracting profile from transcript:", error);
    throw error;
  }
}


