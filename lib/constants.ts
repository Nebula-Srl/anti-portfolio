// ==========================================
// INTERVIEW CONFIGURATION (PARAMETRIZZATO)
// ==========================================

// Fixed interview questions (Italian) - più concise
export const INTERVIEW_QUESTIONS = [
  "Chi sei al di là del tuo lavoro? Cosa ti appassiona?",
] as const;

// Number of fixed questions
export const TOTAL_FIXED_QUESTIONS = INTERVIEW_QUESTIONS.length;

// Maximum follow-up questions after fixed ones
export const MAX_FOLLOWUP_QUESTIONS = 1;

// Total maximum questions (fixed + follow-up)
export const MAX_TOTAL_QUESTIONS =
  TOTAL_FIXED_QUESTIONS + MAX_FOLLOWUP_QUESTIONS;

// ==========================================
// VOICE AGENT CONFIG
// ==========================================

// Silence timeout in seconds - if user stays silent, end conversation
export const SILENCE_TIMEOUT_SECONDS = 90;

// ==========================================
// VALIDATION
// ==========================================

// Slug validation regex
export const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

// ==========================================
// RATE LIMITING
// ==========================================

export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 10;

// ==========================================
// OPENAI CONFIG
// ==========================================

export const OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
export const OPENAI_REALTIME_VOICE = "alloy";
