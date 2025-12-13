import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { convert } from "pdf-img-convert";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert PDF to images and extract text using GPT-4 Vision
async function extractTextFromPDF(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    // Convert PDF pages to images (returns array of Uint8Array)
    const images = await convert(buffer, {
      scale: 2.0, // Higher quality
    });

    if (!images || images.length === 0) {
      return `[PDF: ${fileName} - Nessuna pagina trovata]`;
    }

    // Process first 5 pages max to avoid token limits
    const pagesToProcess = images.slice(0, 5);
    const pageTexts: string[] = [];

    for (let i = 0; i < pagesToProcess.length; i++) {
      const imageData = pagesToProcess[i];
      const base64 = Buffer.from(imageData).toString("base64");

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 2048,
          messages: [
            {
              role: "system",
              content: `Estrai TUTTO il testo visibile da questa pagina di documento.
Per un CV o documento professionale, estrai:
- Nome e contatti
- Esperienza lavorativa (ruoli, aziende, date)
- Formazione
- Competenze e skills
- Certificazioni
- Progetti
- Lingue

Restituisci il testo in formato strutturato. NON inventare informazioni.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Pagina ${i + 1} di "${fileName}":`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        });

        const pageText = response.choices[0]?.message?.content;
        if (pageText) {
          pageTexts.push(`--- Pagina ${i + 1} ---\n${pageText}`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        pageTexts.push(`--- Pagina ${i + 1} ---\n[Errore nell'estrazione]`);
      }
    }

    if (images.length > 5) {
      pageTexts.push(
        `\n[Nota: Il documento ha ${images.length} pagine, elaborate le prime 5]`
      );
    }

    return pageTexts.join("\n\n");
  } catch (error) {
    console.error("PDF conversion error:", error);
    return `[PDF: ${fileName} - Errore nella conversione]`;
  }
}

// Extract text content from document
async function extractTextFromDocument(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  try {
    // For text files, just decode directly
    if (fileType === "text/plain") {
      return buffer.toString("utf-8");
    }

    // For PDFs, convert to images and use GPT-4 Vision
    if (fileType === "application/pdf") {
      return await extractTextFromPDF(buffer, fileName);
    }

    // For images, use GPT-4 Vision directly
    if (fileType.startsWith("image/")) {
      const base64 = buffer.toString("base64");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `Estrai TUTTO il testo visibile dall'immagine.
Per un CV o documento professionale, estrai:
- Nome e contatti
- Esperienza lavorativa (ruoli, aziende, date)
- Formazione
- Competenze e skills
- Certificazioni
- Progetti
- Lingue

Restituisci il testo in formato strutturato. NON inventare informazioni.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Estrai il testo da: "${fileName}"`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      });

      return response.choices[0]?.message?.content || "";
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
  } catch (error) {
    console.error("Error extracting text:", error);
    return "";
  }
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

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File troppo grande. Massimo 10MB." },
        { status: 400 }
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
