import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database
export interface Twin {
  id: string
  slug: string
  display_name: string
  email?: string
  created_at: string
  profile_json: TwinProfile
  transcript: string
  documents: DocumentRef[]
  documents_text?: string // Combined extracted text from all documents
  voice_agent_config: Record<string, unknown>
  is_public: boolean
}

export interface TwinSession {
  id: string
  twin_id: string
  created_at: string
  visitor_session_id: string
  transcript: string
  summary: Record<string, unknown>
}

export interface TwinProfile {
  identity_summary: string
  thinking_patterns: string
  methodology: string
  constraints: string
  proof_metrics: string
  style_tone: string
  do_not_say: string[]
}

export interface DocumentRef {
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  extractedText?: string // Text content extracted from the document for AI context
}

export interface Skill {
  id: string
  twin_id: string
  skill_name: string
  category: 'technical' | 'soft' | 'domain' | 'tools'
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  evidence?: string
  source: 'interview' | 'document' | 'portfolio'
  created_at: string
}

// Create empty/default profile for error fallback
export function createDefaultProfile(): TwinProfile {
  return {
    identity_summary: '-',
    thinking_patterns: '-',
    methodology: '-',
    constraints: '-',
    proof_metrics: '-',
    style_tone: '-',
    do_not_say: []
  }
}
