import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyEditToken } from "@/lib/auth";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const PHOTO_SIZE = 500; // Max width/height

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const editToken = formData.get("editToken") as string;
    const twinId = formData.get("twinId") as string;
    const photo = formData.get("photo") as File;

    if (!editToken || !twinId || !photo) {
      return NextResponse.json(
        { success: false, error: "Token, Twin ID e foto richiesti" },
        { status: 400 }
      );
    }

    // 1. Verify JWT token
    const tokenPayload = verifyEditToken(editToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Token non valido o scaduto" },
        { status: 401 }
      );
    }

    // 2. Verify token matches twin ID
    if (tokenPayload.twinId !== twinId) {
      return NextResponse.json(
        { success: false, error: "Token non autorizzato per questo twin" },
        { status: 403 }
      );
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { success: false, error: "Formato file non valido. Usa JPG o PNG." },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File troppo grande. Massimo 5MB." },
        { status: 400 }
      );
    }

    // 5. Process image with sharp (resize and optimize)
    const buffer = Buffer.from(await photo.arrayBuffer());
    const processedImage = await sharp(buffer)
      .resize(PHOTO_SIZE, PHOTO_SIZE, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const supabase = createServerSupabaseClient();

    // 6. Generate unique filename
    const timestamp = Date.now();
    const filename = `${twinId}/${timestamp}.jpg`;

    // 7. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("twin-profile-photos")
      .upload(filename, processedImage, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Errore nel caricamento della foto" },
        { status: 500 }
      );
    }

    // 8. Get public URL
    const { data: urlData } = supabase.storage
      .from("twin-profile-photos")
      .getPublicUrl(filename);

    const photoUrl = urlData.publicUrl;

    // 9. Update twin with photo URL
    const { error: updateError } = await supabase
      .from("twins")
      .update({ profile_photo_url: photoUrl })
      .eq("id", twinId);

    if (updateError) {
      console.error("Database update error:", updateError);
      // Try to delete uploaded file
      await supabase.storage.from("twin-profile-photos").remove([filename]);
      return NextResponse.json(
        { success: false, error: "Errore nell'aggiornamento del profilo" },
        { status: 500 }
      );
    }

    // 10. Return success with photo URL
    return NextResponse.json({
      success: true,
      photoUrl,
    });
  } catch (error) {
    console.error("Upload photo error:", error);
    return NextResponse.json(
      { success: false, error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

