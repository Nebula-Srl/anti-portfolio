import type { DocumentRef, TwinProfile } from "./supabase/client";

// Portfolio pre-analysis info extracted from URL
export interface PortfolioInfo {
  name?: string;
  occupation?: string;
  company?: string;
  location?: string;
  skills?: string[];
  bio?: string;
  source: "linkedin" | "github" | "behance" | "other";
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
}

// Data collected before interview starts
export interface PreInterviewData {
  slug: string;
  email: string;
  portfolioUrl?: string;
  portfolioInfo?: PortfolioInfo | null;
  documents: DocumentRef[];
}

// Edit session for OTP authentication
export interface EditSession {
  id: string;
  twin_id: string;
  email: string;
  otp_token: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
  verified_at?: string;
}

// JWT token payload for edit sessions
export interface EditTokenPayload {
  sessionId: string;
  twinId: string;
  email: string;
  exp: number;
}

// Profile section type for editing
export type ProfileSection = keyof TwinProfile;

// Request/Response types for edit APIs
export interface RequestOtpRequest {
  slug: string;
}

export interface RequestOtpResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  editToken?: string;
  twin?: any; // Will be typed as Twin
  error?: string;
}

export interface UpdateProfileRequest {
  editToken: string;
  twinId: string;
  updates: {
    profile_json?: Partial<TwinProfile>;
    theme?: string;
    display_name?: string;
  };
}

export interface UpdateProfileResponse {
  success: boolean;
  twin?: any;
  error?: string;
}

export interface GenerateQuestionsRequest {
  section: ProfileSection;
  currentValue: string;
  displayName?: string;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questions?: string[];
  error?: string;
}

export interface VoiceUpdateRequest {
  editToken: string;
  twinId: string;
  transcript: string;
  section?: ProfileSection;
}

export interface VoiceUpdateResponse {
  success: boolean;
  updatedProfile?: TwinProfile;
  error?: string;
}
