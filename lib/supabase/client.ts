import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database
export interface Twin {
  id: string;
  slug: string;
  display_name: string;
  created_at: string;
  profile_json: TwinProfile;
  transcript: string;
  voice_agent_config: Record<string, unknown>;
  is_public: boolean;
}

export interface TwinSession {
  id: string;
  twin_id: string;
  created_at: string;
  visitor_session_id: string;
  transcript: string;
  summary: Record<string, unknown>;
}

export interface TwinProfile {
  identity_summary: string;
  thinking_patterns: string;
  methodology: string;
  constraints: string;
  proof_metrics: string;
  style_tone: string;
  do_not_say: string[];
}
