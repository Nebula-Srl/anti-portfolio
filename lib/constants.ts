// ==========================================
// INTERVIEW CONFIGURATION (PARAMETRIZZATO)
// ==========================================

// Fixed interview questions (Italian) - più concise
export const INTERVIEW_QUESTIONS = [
  "Chi sei al di là del tuo lavoro? Cosa ti appassiona?",
  "Qual è stata la sfida più significativa che hai affrontato e come l'hai risolta?",
  "Come prendi le decisioni importanti?",
  "Quali sono i tuoi principi non negoziabili nel lavoro?",
  "Quali risultati concreti dimostrano il tuo valore?",
] as const;

// Number of fixed questions
export const TOTAL_FIXED_QUESTIONS = INTERVIEW_QUESTIONS.length; // 5

// Maximum follow-up questions after fixed ones
export const MAX_FOLLOWUP_QUESTIONS = 1;

// Total maximum questions (fixed + follow-up)
export const MAX_TOTAL_QUESTIONS =
  TOTAL_FIXED_QUESTIONS + MAX_FOLLOWUP_QUESTIONS; // 10

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
