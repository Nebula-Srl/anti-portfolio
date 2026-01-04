import { NextResponse } from "next/server";
import OpenAI from "openai";
import { verify } from "jsonwebtoken";
import type { EditTokenPayload } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JWT_SECRET =
  process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production";

const sectionPrompts: Record<string, { count: number; prompt: string }> = {
  identity_summary: {
    count: 3,
    prompt: "Genera 3 domande per capire meglio chi è questa persona, cosa fa, il suo background professionale e la sua identità",
  },
  thinking_patterns: {
    count: 5,
    prompt: "Genera 5 domande per comprendere come questa persona ragiona, il suo approccio mentale ai problemi, il suo stile cognitivo",
  },
  methodology: {
    count: 5,
    prompt: "Genera 5 domande sui processi di lavoro, le metodologie utilizzate, gli strumenti, l'organizzazione",
  },
  constraints: {
    count: 5,
    prompt: "Genera 5 domande sui limiti professionali, cosa non fa, cosa non sa fare, le aree dove non opera",
  },
  proof_metrics: {
    count: 5,
    prompt: "Genera 5 domande sui risultati misurabili, numeri, KPI, achievements, successi quantificabili",
  },
  communication_style: {
    count: 5,
    prompt: "Genera 5 domande sullo stile comunicativo, come interagisce con gli altri, il tono, il linguaggio",
  },
};

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
    const { section, sectionLabel, currentValue } = body;

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Sezione richiesta" },
        { status: 400 }
      );
    }

    const config = sectionPrompts[section] || sectionPrompts.identity_summary;

    // Generate prompt
    const systemPrompt = `Sei un esperto intervistatore professionale. ${config.prompt}

Le domande devono essere:
- Aperte e non binarie (no sì/no)
- Specifiche e pratiche
- Orientate a ottenere esempi concreti
- In italiano
- Professionali ma friendly

Rispondi in formato JSON: { "questions": ["domanda 1", "domanda 2", ...] }`;

    const userPrompt = currentValue
      ? `Contesto attuale per "${sectionLabel}": ${currentValue}\n\nGenera ${config.count} domande di approfondimento per migliorare questa sezione.`
      : `Genera ${config.count} domande iniziali per la sezione "${sectionLabel}".`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "Nessuna risposta da OpenAI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(responseText);
    const questions = parsed.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Formato risposta non valido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("Generate questions error:", error);
    return NextResponse.json(
      { success: false, error: "Errore nella generazione delle domande" },
      { status: 500 }
    );
  }
}


