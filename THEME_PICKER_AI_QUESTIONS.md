# ✨ NEW FEATURES: Visual Theme Picker & AI Profile Questions

## 🎨 1. Visual Theme Picker

### Features
- **Desktop**: Grid visuale di 6 temi con preview
- **Mobile**: Select dropdown tradizionale
- **Live Preview**: Il background cambia in tempo reale quando selezioni un tema
- **Visual Feedback**: Ring bianco sul tema selezionato + checkmark

### Temi Disponibili
1. **Cosmic** - Viola cosmico
2. **Sunset** - Arancione tramonto
3. **Ocean** - Blu oceano
4. **Forest** - Verde foresta
5. **Rose** - Rosa elegante
6. **Midnight** - Blu scuro notte

### Componente
`components/theme-picker.tsx`

```tsx
<ThemePicker
  selectedTheme={selectedTheme}
  onChange={setSelectedTheme}
  disabled={saving}
/>
```

### Preview Live
- `useEffect` che aggiorna `document.body.style.background` in real-time
- Cleanup al dismount per ripristinare il background originale
- Smooth transitions tra i temi

---

## 🤖 2. AI Profile Questions

### Features
- **Domande Generate AI**: GPT-4 genera 3-5 domande per sezione
- **Flusso Guidato**: Una domanda alla volta con progress bar
- **Sintesi Automatica**: Le risposte vengono sintetizzate in un paragrafo professionale
- **Multi-Step**: Avanti, Indietro, Salta domande
- **Ctrl+Enter**: Shortcut per rispondere velocemente

### Sezioni Supportate
- `identity_summary` - Chi sono (3 domande)
- `thinking_patterns` - Come ragiono (5 domande)
- `methodology` - Come lavoro (5 domande)
- `constraints` - I miei limiti (5 domande)
- `proof_metrics` - I miei risultati (5 domande)
- `communication_style` - Come comunico (5 domande)

### Componente
`components/profile-ai-questions.tsx`

```tsx
<ProfileAIQuestions
  sectionKey="identity_summary"
  sectionLabel="Chi Sono"
  currentValue={identitySummary}
  onUpdate={setIdentitySummary}
  editToken={editToken}
/>
```

### API Endpoints

#### 1. Generate Questions
`POST /api/twins/edit/generate-questions`

**Request:**
```json
{
  "section": "identity_summary",
  "sectionLabel": "Chi Sono",
  "currentValue": "..."
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    "Qual è il tuo background professionale?",
    "Cosa ti appassiona del tuo lavoro?",
    "Quali sono i tuoi punti di forza?"
  ]
}
```

#### 2. Synthesize Answers
`POST /api/twins/edit/synthesize-answers`

**Request:**
```json
{
  "section": "identity_summary",
  "sectionLabel": "Chi Sono",
  "questions": ["...", "...", "..."],
  "answers": ["...", "...", "..."],
  "currentValue": "..."
}
```

**Response:**
```json
{
  "success": true,
  "synthesizedText": "Sono un Full-Stack Developer con 5 anni di esperienza..."
}
```

### Flow
```
User clicks "Inizia Intervista AI"
  ↓
Generate 3-5 questions via GPT-4
  ↓
Show first question with textarea
  ↓
User answers & clicks "Avanti"
  ↓
Progress to next question
  ↓
After last question → "Termina e Genera"
  ↓
GPT-4 synthesizes all Q&A into professional paragraph
  ↓
Update identitySummary state
  ↓
Return to normal view with updated text
```

---

## 🎯 User Experience

### Theme Picker
1. User scrolls to "Tema Visivo"
2. Sees 6 visual cards with gradients
3. Clicks on a theme
4. **Instant feedback**: Background changes immediately
5. Can try different themes before saving

### AI Questions
1. User goes to "Profilo" tab
2. Sees card "Compila con l'AI"
3. Clicks "Inizia Intervista AI"
4. Answers 3 questions step by step
5. Progress bar shows 33% → 66% → 100%
6. Clicks "Termina e Genera"
7. AI generates professional text
8. Text appears in identity_summary field

---

## 📱 Responsive

### Theme Picker
- **Desktop (≥768px)**: Grid 6x1 con visual cards
- **Mobile (<768px)**: Select dropdown tradizionale

### AI Questions
- Fully responsive
- Textarea auto-resize
- Stack navigation buttons on mobile

---

## 🔐 Security

- Both APIs require JWT token via `Authorization: Bearer <token>`
- Token verified on each request
- Rate limiting via Vercel edge functions

---

## 🧪 Testing

### Test Theme Picker
1. Go to `/t/[slug]/edit?token=XXX`
2. Scroll to theme section
3. Click different themes
4. Verify background changes instantly
5. Save and verify persistence

### Test AI Questions
1. Go to `/t/[slug]/edit?token=XXX`
2. Go to "Profilo" tab
3. Click "Inizia Intervista AI"
4. Answer questions
5. Verify synthesis
6. Check identitySummary updated

---

## 🎨 Design Highlights

### Theme Picker
- Height: 80px cards
- Accent color bar at bottom
- Checkmark on selected
- Hover scale effect
- Ring animation

### AI Questions
- Purple theme (#8b5cf6)
- Brain icon
- Smooth progress bar
- Q&A summary at bottom
- Keyboard shortcuts

---

## ✅ Status
**COMPLETED** - Both features fully functional and integrated! 🚀

