import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditTwinPageClient } from "./edit-client";
import type { Twin, Skill } from "@/lib/supabase/client";

interface EditTwinPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

async function getTwin(slug: string): Promise<Twin | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("twins")
    .select("*")
    .eq("slug", slug.toLowerCase())
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

export default async function EditTwinPage({
  params,
  searchParams,
}: EditTwinPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  // Check if user has edit token
  if (!token) {
    // Redirect to main page with error
    redirect(`/t/${slug}?error=unauthorized`);
  }

  const twin = await getTwin(slug);

  if (!twin) {
    notFound();
  }

  // Load skills
  const skills = await getTwinSkills(twin.id);

  return <EditTwinPageClient twin={twin} skills={skills} editToken={token} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditTwinPageProps) {
  const { slug } = await params;
  const twin = await getTwin(slug);

  if (!twin) {
    return {
      title: "Twin non trovato",
    };
  }

  return {
    title: `Modifica ${twin.display_name} - Digital Twin`,
    description: `Modifica il profilo Digital Twin di ${twin.display_name}`,
    robots: "noindex, nofollow", // Don't index edit pages
  };
}

