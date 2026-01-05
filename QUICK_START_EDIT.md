# Twin Profile Edit System - Quick Start

## 🚀 Setup Rapido (10 minuti)

### 1. Installa Dipendenze
```bash
npm install
# La dipendenza jsonwebtoken è già installata
```

### 2. Configura Environment Variables

**Genera JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Crea `.env.local` con:**
```env
# Existing (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key

# NEW - Required
JWT_SECRET_KEY=<il_token_generato_sopra>
```

### 3. Aggiorna Database

In Supabase Dashboard → SQL Editor, esegui:

```sql
-- 1. Aggiungi colonna foto
ALTER TABLE twins ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2. Crea tabella sessioni OTP
CREATE TABLE IF NOT EXISTS twin_edit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id UUID NOT NULL REFERENCES twins(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_token TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_edit_sessions_twin_id ON twin_edit_sessions(twin_id);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_token ON twin_edit_sessions(otp_token);

ALTER TABLE twin_edit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request edit OTP" ON twin_edit_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can verify OTP" ON twin_edit_sessions FOR SELECT USING (true);
CREATE POLICY "System can update verification" ON twin_edit_sessions FOR UPDATE USING (true);
```

### 4. Abilita Email OTP in Supabase ⚠️ IMPORTANTE

**Supabase Dashboard:**
1. Vai su **Authentication** → **Providers**
2. Trova la sezione **Email**
3. Attiva queste opzioni:
   - ✅ **Enable Email provider**
   - ✅ **Enable Email OTP**
4. **Salva** le modifiche

📖 **Guida completa**: Vedi `SUPABASE_OTP_SETUP.md`

### 5. Crea Storage Bucket

In Supabase Dashboard → Storage:

1. Click **"New bucket"**
2. Nome: `twin-profile-photos`
3. ✅ Public bucket
4. Create

Poi in **Storage Policies**, aggiungi:

```sql
CREATE POLICY "Allow upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'twin-profile-photos');

CREATE POLICY "Public photos are downloadable"
ON storage.objects FOR SELECT
USING (bucket_id = 'twin-profile-photos');
```

### 5. Avvia l'App

```bash
npm run dev
```

### 6. Testa!

1. Crea un twin con email (o usa uno esistente)
2. Visita `/t/[slug]`
3. Click **"Modifica Profilo"**
4. Inserisci l'email → **Riceverai OTP via email!** 📧
5. Inserisci il codice e modifica il profilo

**Note:**
- In development, l'OTP viene anche loggato nella console del server
- L'email arriva da Supabase Auth (verifica anche Spam)
- Per personalizzare l'email, vedi `SUPABASE_OTP_SETUP.md`

---

## ✨ Funzionalità Implementate

- ✅ Autenticazione OTP via email (Supabase Auth, 15 min validity)
- ✅ Modifica sezioni profilo (6 sezioni)
- ✅ Editing tramite form testuale
- ✅ Editing tramite conversazione vocale AI
- ✅ Generazione domande GPT per approfondire
- ✅ Selezione tema (10 temi disponibili)
- ✅ Upload foto profilo (max 5MB, auto-resize)
- ✅ Token JWT sicuro (1 ora validity)
- ✅ Rate limiting OTP (max 3/10min)

---

## 📁 File Creati

### Backend (API Routes)
- `app/api/twins/edit/request-otp/route.ts`
- `app/api/twins/edit/verify-otp/route.ts`
- `app/api/twins/edit/update/route.ts`
- `app/api/twins/edit/upload-photo/route.ts`
- `app/api/twins/edit/generate-questions/route.ts`
- `app/api/twins/edit/voice-update/route.ts`

### Frontend (Components)
- `components/edit-twin-button.tsx`
- `components/edit-twin-dialog.tsx`
- `components/otp-verification.tsx`
- `components/edit-profile-form.tsx`
- `components/edit-profile-voice.tsx`
- `components/theme-selector.tsx`
- `components/photo-upload.tsx`

### Utilities
- `lib/auth.ts` (JWT verification)
- `lib/types.ts` (aggiornato)
- `lib/prompts.ts` (aggiornato)

### Database
- `database-updates.sql`

---

## 🔧 Troubleshooting

### Email OTP non arriva?
- **Verifica che Email OTP sia abilitato** in Supabase Dashboard
- Controlla console del server per log OTP (in development)
- Verifica cartella Spam/Junk
- Vedi guida completa in **SUPABASE_OTP_SETUP.md**

### Errore "Signups not allowed for otp"?
- Email OTP non è abilitato in Supabase
- Vai su: Authentication → Providers → Email → Enable Email OTP

### Token non valido?
- Verifica `JWT_SECRET_KEY` in `.env.local`

### Storage errore?
- Verifica bucket creato in Supabase Storage
- Verifica policies aggiunte

---

Per documentazione completa, vedi **EDIT_IMPLEMENTATION.md**

