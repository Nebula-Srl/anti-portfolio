import OpenAI from "openai";
import type { Skill } from "@/lib/supabase/client";
import type { PortfolioInfo } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SkillExtraction {
  skill_name: string;
  category: "technical" | "soft" | "domain" | "tools";
  proficiency_level?: "beginner" | "intermediate" | "advanced" | "expert";
  evidence?: string;
  source: "interview" | "document" | "portfolio";
}

/**
 * Extract skills from interview transcript, documents, and portfolio info
 */
export async function extractSkills(
  transcript: string,
  documentsText?: string | null,
  portfolioInfo?: PortfolioInfo | null
): Promise<Omit<Skill, "id" | "twin_id" | "created_at">[]> {
  try {
    // Build context sections
    let context = `# TRASCRIZIONE INTERVISTA\n${transcript}\n\n`;

    if (documentsText && documentsText.trim()) {
      context += `# DOCUMENTI CARICATI\n${documentsText}\n\n`;
    }

    if (portfolioInfo) {
      context += `# PORTFOLIO INFO\n`;
      if (portfolioInfo.name) context += `Nome: ${portfolioInfo.name}\n`;
      if (portfolioInfo.occupation)
        context += `Occupazione: ${portfolioInfo.occupation}\n`;
      if (portfolioInfo.bio) context += `Bio: ${portfolioInfo.bio}\n`;
      if (portfolioInfo.skills && portfolioInfo.skills.length > 0) {
        context += `Skills elencate: ${portfolioInfo.skills.join(", ")}\n`;
      }
      context += `\n`;
    }

    const prompt = `Analizza il seguente contenuto ed estrai TUTTE le competenze professionali della persona.

${context}

ISTRUZIONI:
1. Identifica competenze in 4 categorie:
   - technical: linguaggi programmazione, framework, tecnologie specifiche
   - soft: comunicazione, leadership, problem-solving, teamwork, etc.
   - domain: conoscenze settoriali (es: marketing, finanza, design UX)
   - tools: software, piattaforme, strumenti specifici (es: Figma, Jira, Excel)

2. Per ogni skill, determina il livello di competenza basandoti su:
   - beginner: menzionato ma senza esperienza dettagliata
   - intermediate: usato in progetti, ma non expertise
   - advanced: usato frequentemente con risultati concreti
   - expert: padronanza dimostrata, insegna ad altri, risultati eccellenti

3. Per ogni skill, estrai UNA BREVE citazione che la dimostra (max 100 caratteri)

4. Indica la fonte: 'interview', 'document', o 'portfolio'

REGOLE:
- Estrai SOLO competenze esplicitamente menzionate o chiaramente dimostrate
- NON inventare competenze
- Se il livello non è chiaro, ometti proficiency_level
- Sii specifico (es: "React" non "JavaScript frameworks")
- Includi sia hard skills che soft skills

Restituisci un JSON array di skills:

\`\`\`json
[
  {
    "skill_name": "React",
    "category": "technical",
    "proficiency_level": "advanced",
    "evidence": "Ho sviluppato 3 app con React negli ultimi 2 anni",
    "source": "interview"
  },
  ...
]
\`\`\`

Rispondi SOLO con il JSON array, senza altro testo.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Sei un esperto HR/recruiter specializzato nell'identificazione di competenze professionali. Estrai skills in modo preciso e strutturato.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    const extracted: SkillExtraction[] = JSON.parse(jsonStr);

    // Validate and return
    return extracted.filter(
      (skill) =>
        skill.skill_name &&
        skill.category &&
        ["technical", "soft", "domain", "tools"].includes(skill.category) &&
        ["interview", "document", "portfolio"].includes(skill.source)
    );
  } catch (error) {
    console.error("Skills extraction error:", error);
    // Return empty array on error - don't fail the whole process
    return [];
  }
}

