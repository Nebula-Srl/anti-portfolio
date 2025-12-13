import type { DocumentRef } from './supabase/client'

// Portfolio pre-analysis info extracted from URL
export interface PortfolioInfo {
  name?: string
  occupation?: string
  company?: string
  location?: string
  skills?: string[]
  bio?: string
  source: 'linkedin' | 'github' | 'behance' | 'other'
  sourceUrl: string
  confidence: 'high' | 'medium' | 'low'
}

// Data collected before interview starts
export interface PreInterviewData {
  slug: string
  email: string
  portfolioUrl?: string
  portfolioInfo?: PortfolioInfo | null
  documents: DocumentRef[]
}
