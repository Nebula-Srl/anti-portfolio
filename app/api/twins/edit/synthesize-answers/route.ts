import { NextResponse } from "next/server";
import OpenAI from "openai";
import { verify } from "jsonwebtoken";
import type { EditTokenPayload } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JWT_SECRET =
  process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production";

export async function POST(request: Request) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token non fornito" },
        { status: 401 }
      );
    }

    let tokenPayload: EditTokenPayload;
    try {
      tokenPayload = verify(token, JWT_SECRET) as EditTokenPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "Token non valido o scaduto" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, sectionLabel, questions, answers, currentValue } = body;

    if (!section || !questions || !answers) {
      return NextResponse.json(
        { success: false, error: "Dati incompleti" },
        { status: 400 }
      );
    }

    // Build Q&A pairs
    const qaText = questions
      .map((q: string, i: number) => {
        const answer = answers[i];
        if (!answer) return null;
        return `Q: ${q}\nA: ${answer}`;
      })
      .filter(Boolean)
      .join("\n\n");

    // Generate synthesis prompt
    const systemPrompt = `Sei un esperto copywriter che trasforma interviste in testo di profilo professionale.

Il tuo compito:
1. Leggere le domande e risposte fornite
2. Sintetizzare in un paragrafo fluido e professionale
3. Usare prima persona ("sono", "lavoro", "faccio")
4. Mantenere uno stile naturale e autentico
5. Evidenziare i punti chiave senza essere prolisso
6. ${currentValue ? "Integrare con il contenuto esistente se pertinente" : "Creare un nuovo testo"}

Lunghezza: 3-5 frasi per identity_summary, 5-8 frasi per altre sezioni.`;

    const userPrompt = `Sezione: ${sectionLabel}
${currentValue ? `\nContenuto esistente: ${currentValue}\n` : ""}
Domande e Risposte:
${qaText}

Genera un testo professionale per questa sezione del profilo.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const synthesizedText = completion.choices[0]?.message?.content?.trim();
    
    if (!synthesizedText) {
      return NextResponse.json(
        { success: false, error: "Nessuna risposta da OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      synthesizedText,
    });
  } catch (error) {
    console.error("Synthesize answers error:", error);
    return NextResponse.json(
      { success: false, error: "Errore nella sintesi delle risposte" },
      { status: 500 }
    );
  }
}

