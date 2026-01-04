import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyEditToken } from "@/lib/auth";
import type { UpdateProfileRequest, UpdateProfileResponse } from "@/lib/types";
import type { TwinProfile } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body: UpdateProfileRequest = await request.json();
    const { editToken, twinId, updates } = body;

    if (!editToken || !twinId) {
      return NextResponse.json(
        { success: false, error: "Token e Twin ID richiesti" } as UpdateProfileResponse,
        { status: 400 }
      );
    }

    // 1. Verify JWT token
    const tokenPayload = verifyEditToken(editToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Token non valido o scaduto" } as UpdateProfileResponse,
        { status: 401 }
      );
    }

    // 2. Verify token matches twin ID
    if (tokenPayload.twinId !== twinId) {
      return NextResponse.json(
        { success: false, error: "Token non autorizzato per questo twin" } as UpdateProfileResponse,
        { status: 403 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 3. Get current twin data
    const { data: currentTwin, error: fetchError } = await supabase
      .from("twins")
      .select("*")
      .eq("id", twinId)
      .single();

    if (fetchError || !currentTwin) {
      return NextResponse.json(
        { success: false, error: "Twin non trovato" } as UpdateProfileResponse,
        { status: 404 }
      );
    }

    // 4. Prepare update object
    const updateData: any = {};

    // Handle profile_json updates (merge with existing)
    if (updates.profile_json) {
      const currentProfile = currentTwin.profile_json as TwinProfile;
      updateData.profile_json = {
        ...currentProfile,
        ...updates.profile_json,
      };
    }

    // Handle theme update
    if (updates.theme) {
      updateData.theme = updates.theme;
    }

    // Handle display_name update
    if (updates.display_name) {
      updateData.display_name = updates.display_name;
    }

    // 5. Update twin in database
    const { data: updatedTwin, error: updateError } = await supabase
      .from("twins")
      .update(updateData)
      .eq("id", twinId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating twin:", updateError);
      return NextResponse.json(
        { success: false, error: "Errore nell'aggiornamento" } as UpdateProfileResponse,
        { status: 500 }
      );
    }

    // 6. Return success with updated twin
    return NextResponse.json({
      success: true,
      twin: updatedTwin,
    } as UpdateProfileResponse);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" } as UpdateProfileResponse,
      { status: 500 }
    );
  }
}

