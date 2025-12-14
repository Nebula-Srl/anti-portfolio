import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SLUG_REGEX } from "@/lib/constants";
import {
  createDefaultProfile,
  type TwinProfile,
  type DocumentRef,
} from "@/lib/supabase/client";
import { extractSkills } from "@/lib/openai/skills-extraction";
import type { PortfolioInfo } from "@/lib/types";
import { getRandomTheme } from "@/lib/themes";

interface SaveTwinRequest {
  slug: string;
  displayName?: string;
  email?: string;
  profile?: Partial<TwinProfile>;
  transcript?: string;
  documents?: DocumentRef[];
  portfolioInfo?: PortfolioInfo;
}

// Ensure profile has all required fields with fallbacks
function normalizeProfile(profile?: Partial<TwinProfile>): TwinProfile {
  const defaultProfile = createDefaultProfile();

  if (!profile) return defaultProfile;

  return {
    identity_summary:
      profile.identity_summary || defaultProfile.identity_summary,
    thinking_patterns:
      profile.thinking_patterns || defaultProfile.thinking_patterns,
    methodology: profile.methodology || defaultProfile.methodology,
    constraints: profile.constraints || defaultProfile.constraints,
    proof_metrics: profile.proof_metrics || defaultProfile.proof_metrics,
    style_tone: profile.style_tone || defaultProfile.style_tone,
    do_not_say: Array.isArray(profile.do_not_say)
      ? profile.do_not_say
      : defaultProfile.do_not_say,
  };
}

export async function POST(request: Request) {
  try {
    const body: SaveTwinRequest = await request.json();
    const {
      slug,
      displayName,
      email,
      profile,
      transcript,
      documents,
      portfolioInfo,
    } = body;

    // Validate slug (required)
    if (!slug) {
      return NextResponse.json({ error: "Slug richiesto" }, { status: 400 });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    if (!SLUG_REGEX.test(normalizedSlug)) {
      return NextResponse.json(
        { error: "Formato slug non valido" },
        { status: 400 }
      );
    }

    // Normalize profile with fallbacks for missing fields
    const normalizedProfile = normalizeProfile(profile);

    // Use slug as display name if not provided
    const finalDisplayName =
      displayName ||
      normalizedSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Extract and combine all document text
    let documentsText: string | null = null;
    if (documents && documents.length > 0) {
      const textParts = documents
        .filter((doc) => doc.extractedText)
        .map((doc) => `=== ${doc.name} ===\n${doc.extractedText}`);
      if (textParts.length > 0) {
        documentsText = textParts.join("\n\n");
      }
    }

    // Save to database
    const supabase = createServerSupabaseClient();

    // Generate random theme for this twin
    const theme = getRandomTheme();

    const { data, error } = await supabase
      .from("twins")
      .insert({
        slug: normalizedSlug,
        display_name: finalDisplayName,
        email: email || null,
        profile_json: normalizedProfile,
        transcript: transcript || "-",
        documents: documents || [],
        documents_text: documentsText,
        is_public: true,
        theme: theme,
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Database error:", error);

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Questo nome è già in uso" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Errore nel salvataggio. Riprova." },
        { status: 500 }
      );
    }

    // Extract skills asynchronously (don't block response)
    // This runs in the background after twin is saved
    if (data?.id) {
      extractAndSaveSkills(
        data.id,
        transcript || "-",
        documentsText,
        portfolioInfo
      ).catch((err) => {
        console.error("Skills extraction failed (non-blocking):", err);
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      success: true,
      twin: {
        id: data.id,
        slug: data.slug,
        url: `${appUrl}/t/${data.slug}`,
      },
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

/**
 * Extract and save skills asynchronously (non-blocking)
 */
async function extractAndSaveSkills(
  twinId: string,
  transcript: string,
  documentsText: string | null,
  portfolioInfo?: PortfolioInfo
) {
  const startTime = Date.now();
  console.log(`[Skills Extraction] Starting for twin ${twinId}`);

  try {
    // Ensure transcript is valid
    if (!transcript || transcript === "-" || transcript.length < 50) {
      console.warn(
        `[Skills Extraction] Transcript too short for twin ${twinId} (${transcript.length} chars)`
      );
      // Still try with portfolio info if available
    }

    const skills = await extractSkills(
      transcript,
      documentsText,
      portfolioInfo
    );

    const duration = Date.now() - startTime;
    console.log(
      `[Skills Extraction] Completed in ${duration}ms - found ${skills.length} skills for twin ${twinId}`
    );

    if (skills.length === 0) {
      console.error(
        `[Skills Extraction] ⚠️ WARNING: No skills extracted for twin ${twinId} - this should not happen with fallback enabled!`
      );
      return;
    }

    // Save skills to database
    const supabase = createServerSupabaseClient();

    const skillsToInsert = skills.map((skill) => ({
      twin_id: twinId,
      skill_name: skill.skill_name,
      category: skill.category,
      proficiency_level: skill.proficiency_level || null,
      evidence: skill.evidence || null,
      source: skill.source,
    }));

    const { error } = await supabase.from("skills").insert(skillsToInsert);

    if (error) {
      console.error(`[Skills Extraction] Error saving skills for twin ${twinId}:`, error);
      throw error;
    }

    console.log(
      `[Skills Extraction] ✓ Successfully saved ${skills.length} skills for twin ${twinId}`
    );
  } catch (error) {
    console.error(
      `[Skills Extraction] ❌ Fatal error for twin ${twinId}:`,
      error
    );
    // Don't throw - this is non-blocking, but log prominently
  }
}
