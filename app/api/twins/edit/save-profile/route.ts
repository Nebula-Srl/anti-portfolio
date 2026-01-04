import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verify } from "jsonwebtoken";
import type { EditTokenPayload } from "@/lib/types";
import type { TwinProfile, Skill } from "@/lib/supabase/client";

const JWT_SECRET =
  process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production";

interface SaveProfileRequest {
  displayName: string;
  profilePhotoUrl?: string;
  identitySummary: string;
  theme: string;
  skills: Skill[];
}

export async function POST(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token non fornito" },
        { status: 401 }
      );
    }

    // Verify JWT token
    let tokenPayload: EditTokenPayload;
    try {
      tokenPayload = verify(token, JWT_SECRET) as EditTokenPayload;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Token non valido o scaduto" },
        { status: 401 }
      );
    }

    const body: SaveProfileRequest = await request.json();
    const { displayName, profilePhotoUrl, identitySummary, theme, skills } =
      body;

    const supabase = createServerSupabaseClient();

    // 1. Get current twin data
    const { data: currentTwin, error: fetchError } = await supabase
      .from("twins")
      .select("*")
      .eq("id", tokenPayload.twinId)
      .single();

    if (fetchError || !currentTwin) {
      return NextResponse.json(
        { success: false, error: "Twin non trovato" },
        { status: 404 }
      );
    }

    // 2. Update profile_json with new data
    const currentProfile = (currentTwin.profile_json as TwinProfile) || {};
    const updatedProfile: TwinProfile = {
      ...currentProfile,
      identity_summary: identitySummary,
    };

    // 3. Update twin in database
    const { data: updatedTwin, error: updateError } = await supabase
      .from("twins")
      .update({
        display_name: displayName,
        profile_photo_url: profilePhotoUrl,
        profile_json: updatedProfile,
        theme: theme,
      })
      .eq("id", tokenPayload.twinId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating twin:", updateError);
      return NextResponse.json(
        { success: false, error: "Errore nell'aggiornamento del profilo" },
        { status: 500 }
      );
    }

    // 4. Update skills - delete old and insert new
    // First, get existing skills
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id")
      .eq("twin_id", tokenPayload.twinId);

    // Delete existing skills
    if (existingSkills && existingSkills.length > 0) {
      await supabase.from("skills").delete().eq("twin_id", tokenPayload.twinId);
    }

    // Insert new skills (filter out temp IDs)
    const skillsToInsert = skills
      .filter((skill) => !skill.id.startsWith("temp-"))
      .map((skill) => ({
        twin_id: tokenPayload.twinId,
        category: skill.category,
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level,
      }));

    // Also include skills with temp IDs (they're new skills)
    const newSkills = skills
      .filter((skill) => skill.id.startsWith("temp-"))
      .map((skill) => ({
        twin_id: tokenPayload.twinId,
        category: skill.category,
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level,
      }));

    const allSkillsToInsert = [...skillsToInsert, ...newSkills];

    if (allSkillsToInsert.length > 0) {
      const { error: skillsError } = await supabase
        .from("skills")
        .insert(allSkillsToInsert);

      if (skillsError) {
        console.error("Error updating skills:", skillsError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      twin: updatedTwin,
    });
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
