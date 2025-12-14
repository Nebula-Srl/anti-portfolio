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
   - soft: comunicazione, leadership, problem-solving, teamwork, creatività, etc.
   - domain: conoscenze settoriali (es: marketing, finanza, design UX, gestione progetti)
   - tools: software, piattaforme, strumenti specifici (es: Figma, Jira, Excel, VS Code)

2. Per ogni skill, determina il livello di competenza basandoti su:
   - beginner: menzionato ma senza esperienza dettagliata
   - intermediate: usato in progetti, ma non expertise
   - advanced: usato frequentemente con risultati concreti
   - expert: padronanza dimostrata, insegna ad altri, risultati eccellenti

3. Per ogni skill, estrai UNA BREVE citazione che la dimostra (max 100 caratteri)

4. Indica la fonte: 'interview', 'document', o 'portfolio'

REGOLE FONDAMENTALI:
- Estrai TUTTE le competenze menzionate esplicitamente O chiaramente dimostrate
- Se la persona parla del suo lavoro/progetti, DEDUCI le competenze tecniche/tools usate
- Estrai SEMPRE almeno 5-10 skills diverse
- Includi soft skills basandoti su come si esprime (es: problem-solving, comunicazione, lavoro di squadra)
- Se il livello non è chiaro, usa 'intermediate' come default
- Sii specifico (es: "React" non "JavaScript frameworks")
- NON lasciare l'array vuoto - ci devono SEMPRE essere skills
- Se l'intervista è breve, estrai comunque quello che c'è

ESEMPIO OUTPUT (MINIMO 5 SKILLS):

\`\`\`json
[
  {
    "skill_name": "React",
    "category": "technical",
    "proficiency_level": "advanced",
    "evidence": "Ho sviluppato 3 app con React negli ultimi 2 anni",
    "source": "interview"
  },
  {
    "skill_name": "Problem Solving",
    "category": "soft",
    "proficiency_level": "advanced",
    "evidence": "Affronto problemi complessi scomponendoli in parti",
    "source": "interview"
  },
  {
    "skill_name": "TypeScript",
    "category": "technical",
    "proficiency_level": "intermediate",
    "evidence": "Uso TypeScript per i progetti frontend",
    "source": "document"
  }
]
\`\`\`

IMPORTANTE: Rispondi SOLO con il JSON array completo. DEVI estrarre ALMENO 5-10 skills. NON restituire un array vuoto.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Sei un esperto HR/recruiter specializzato nell'identificazione di competenze professionali. Il tuo compito è estrarre SEMPRE almeno 5-10 skills da qualsiasi trascrizione. Sii proattivo nell'identificare competenze anche da informazioni implicite.",
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

    // Validate and filter
    const validSkills = extracted.filter(
      (skill) =>
        skill.skill_name &&
        skill.category &&
        ["technical", "soft", "domain", "tools"].includes(skill.category) &&
        ["interview", "document", "portfolio"].includes(skill.source)
    );

    // If we got valid skills, return them
    if (validSkills.length > 0) {
      console.log(`✓ Extracted ${validSkills.length} skills successfully`);
      return validSkills;
    }

    // If extraction returned empty, try to generate basic skills from context
    console.warn("⚠ Skills extraction returned empty array, generating fallback skills");
    return generateFallbackSkills(transcript, portfolioInfo);
  } catch (error) {
    console.error("Skills extraction error:", error);
    // Try to generate basic fallback skills instead of returning empty
    return generateFallbackSkills(transcript, portfolioInfo);
  }
}

/**
 * Generate basic fallback skills from transcript and portfolio info
 * Used when GPT extraction fails
 */
function generateFallbackSkills(
  transcript: string,
  portfolioInfo?: PortfolioInfo | null
): Omit<Skill, "id" | "twin_id" | "created_at">[] {
  const fallbackSkills: Omit<Skill, "id" | "twin_id" | "created_at">[] = [];

  // Extract from portfolio info if available
  if (portfolioInfo?.skills && portfolioInfo.skills.length > 0) {
    portfolioInfo.skills.slice(0, 10).forEach((skillName) => {
      fallbackSkills.push({
        skill_name: skillName,
        category: "technical",
        proficiency_level: "intermediate",
        evidence: "Menzionato nel portfolio",
        source: "portfolio",
      });
    });
  }

  if (portfolioInfo?.occupation) {
    fallbackSkills.push({
      skill_name: portfolioInfo.occupation,
      category: "domain",
      proficiency_level: "intermediate",
      evidence: `Ruolo: ${portfolioInfo.occupation}`,
      source: "portfolio",
    });
  }

  // Add generic soft skills based on having completed an interview
  if (transcript.length > 100) {
    fallbackSkills.push(
      {
        skill_name: "Comunicazione",
        category: "soft",
        proficiency_level: "intermediate",
        evidence: "Capacità di comunicare le proprie esperienze",
        source: "interview",
      },
      {
        skill_name: "Pensiero Critico",
        category: "soft",
        proficiency_level: "intermediate",
        evidence: "Capacità di analisi e riflessione",
        source: "interview",
      }
    );
  }

  console.log(`Generated ${fallbackSkills.length} fallback skills`);
  return fallbackSkills;
}

