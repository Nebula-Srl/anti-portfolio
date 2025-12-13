// ==========================================
// INTERVIEW CONFIGURATION (PARAMETRIZZATO)
// ==========================================

// Fixed interview questions (Italian) - organized by category
export const INTERVIEW_QUESTIONS = [
  // 1. Background & percorso
  "Da dove vieni e qual è stato il tuo percorso fino ad oggi?",
  "C'è stato un momento che ti ha fatto cambiare strada nel lavoro?",

  // 2. Ruolo & competenze
  "Cosa fai davvero nel tuo lavoro, senza usare il job title?",
  "In cosa senti di fare davvero la differenza?",
  "Quali strumenti software usi ogni giorno?",

  // 3. Progetti significativi
  "Qual è il progetto che ti rappresenta di più? Perché?",

  // 4. Metodologia
  "Quando hai un problema poco chiaro, cosa fai per prima cosa?",
  "Come decidi quando ti mancano informazioni? Fammi un esempio.",

  // 5. Valori
  "Su quale valore professionale non scendi mai a compromessi?",

  // 6. Passioni
  "In quale attività lavorativa il tempo vola senza accorgertene?",

  // 7. Limiti & frustrazioni
  "Qual è una situazione che ti toglie energie quando lavori?",
  "Qual è un tuo limite che cerchi di gestire attivamente?",

  // 8. Fallimenti
  "Raccontami un errore significativo che ricordi ancora. Perché è successo?",

  // 9. Unicità
  "Cosa ti viene naturale e che gli altri ti riconoscono sempre?",
] as const;

// Number of fixed questions
export const TOTAL_FIXED_QUESTIONS = INTERVIEW_QUESTIONS.length; // 14

// Maximum follow-up questions after fixed ones
export const MAX_FOLLOWUP_QUESTIONS = 2;

// Total maximum questions (fixed + follow-up)
export const MAX_TOTAL_QUESTIONS =
  TOTAL_FIXED_QUESTIONS + MAX_FOLLOWUP_QUESTIONS; // 16

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
