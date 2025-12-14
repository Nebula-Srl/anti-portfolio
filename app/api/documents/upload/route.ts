import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// Configure route to handle larger payloads
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for file processing

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract text from PDF using OpenAI's base64 file input
async function extractTextFromPDF(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    const base64 = buffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sei un estrattore di contenuti da documenti PDF. Estrai TUTTO il contenuto testuale dal documento.

Per un CV o documento professionale, estrai in modo strutturato:
- Nome completo e contatti (email, telefono, LinkedIn)
- Riepilogo professionale / Obiettivi
- Esperienza lavorativa (ruolo, azienda, date, responsabilità, risultati)
- Formazione (titolo, istituto, date)
- Competenze tecniche e soft skills
- Certificazioni
- Progetti rilevanti
- Lingue parlate
- Altre informazioni presenti

Mantieni la struttura originale del documento. NON inventare informazioni non presenti.`,
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: fileName,
                file_data: `data:application/pdf;base64,${base64}`,
              },
            },
            {
              type: "text",
              text: "Estrai tutto il contenuto testuale da questo documento PDF.",
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    return `[Errore nell'estrazione del PDF: ${fileName}]`;
  }
}

// Extract text from image using GPT-4 Vision
async function extractTextFromImage(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  try {
    const base64 = buffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `Estrai TUTTO il testo visibile dall'immagine.
Per un CV o documento professionale, estrai in modo strutturato tutte le informazioni presenti.
NON inventare informazioni non presenti nell'immagine.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${fileType};base64,${base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `Estrai tutto il testo da: "${fileName}"`,
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Image extraction error:", error);
    return "";
  }
}

// Extract text content from document
async function extractTextFromDocument(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  // For text files, just decode directly
  if (fileType === "text/plain") {
    return buffer.toString("utf-8");
  }

  // For PDFs, use OpenAI's base64 file input
  if (fileType === "application/pdf") {
    return await extractTextFromPDF(buffer, fileName);
  }

  // For images, use GPT-4 Vision
  if (fileType.startsWith("image/")) {
    return await extractTextFromImage(buffer, fileType, fileName);
  }

  // For Word documents
  if (
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return `[Documento Word: ${fileName} - Carica una versione PDF per estrarre il contenuto]`;
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slug = formData.get("slug") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nessun file caricato" },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json({ error: "Slug richiesto" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo di file non supportato. Usa PDF, DOC, DOCX, TXT o immagini.",
        },
        { status: 400 }
      );
    }

    // Max 4MB (Vercel body limit is ~4.5MB)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File troppo grande. Massimo 4MB." },
        { status: 413 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text content from document
    const extractedText = await extractTextFromDocument(
      buffer,
      file.type,
      file.name
    );

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage error:", error);
      return NextResponse.json(
        { error: "Errore nel caricamento. Riprova." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      document: {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        extractedText: extractedText || undefined,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Errore durante il caricamento" },
      { status: 500 }
    );
  }
}
