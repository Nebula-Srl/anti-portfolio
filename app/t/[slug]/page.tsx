import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TwinConversation } from "./twin-conversation";
import type { Twin, Skill, TwinProfile } from "@/lib/supabase/client";
import { getTheme } from "@/lib/themes";
import { Sparkles } from "lucide-react";

interface TwinPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getTwin(slug: string): Promise<Twin | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("twins")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Twin;
}

async function getTwinSkills(twinId: string): Promise<Skill[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("twin_id", twinId)
    .order("category", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Skill[];
}

export default async function TwinPage({ params }: TwinPageProps) {
  const { slug } = await params;
  const twin = await getTwin(slug);

  if (!twin) {
    notFound();
  }

  // Load skills
  const skills = await getTwinSkills(twin.id);

  // Get theme configuration
  const theme = getTheme(twin.theme || "cosmic");

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme.gradient,
      }}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Floating orbs */}
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl animate-float opacity-30"
          style={{ backgroundColor: theme.accentColor }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float opacity-20"
          style={{
            backgroundColor: theme.secondaryColor,
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <Sparkles
              className="w-4 h-4"
              style={{ color: theme.accentColor }}
            />
            <span className="text-sm text-white/80">Digital Twin</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-linear-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              {twin.display_name}
            </span>
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <p className="text-white text-sm">
              {(twin.profile_json as TwinProfile).identity_summary &&
              (twin.profile_json as TwinProfile).identity_summary !== "-"
                ? (twin.profile_json as TwinProfile).identity_summary
                : `Parla con il Digital Twin di ${twin.display_name}. Scopri di più attraverso una conversazione vocale.`}
            </p>
          </div>
        </div>

        {/* Twin Conversation Component with theme */}
        <TwinConversation twin={twin} skills={skills} theme={theme} />
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: TwinPageProps) {
  const { slug } = await params;
  const twin = await getTwin(slug);

  if (!twin) {
    return {
      title: "Twin non trovato",
    };
  }

  return {
    title: `${twin.display_name} - Digital Twin`,
    description: `Parla con il Digital Twin di ${twin.display_name}`,
  };
}
