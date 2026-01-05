# 🔧 Fix: "Signups not allowed for otp" Error

## Il Problema

Hai abilitato "Email OTP" ma ricevi ancora questo errore:

```
Error [AuthApiError]: Signups not allowed for otp
```

**Causa**: Supabase ha i signup disabilitati. Quando usi `signInWithOtp()`, Supabase cerca di creare un utente Auth se non esiste, ma i signup sono bloccati.

---

## ✅ Soluzione Rapida (2 minuti)

### Abilita Signup in Supabase Dashboard

1. Vai su **Supabase Dashboard** (https://app.supabase.com)
2. Seleziona il tuo progetto
3. Nel menu laterale, vai su **Authentication**
4. Nella tab **Settings** (o Configuration)
5. Trova la sezione **"Auth Settings"** o **"User Signups"**
6. Attiva: **"Allow new users to sign up"** ✅
7. **Salva** le modifiche

**Path completo:**

```
Dashboard → Authentication → Settings → Allow new users to sign up
```

---

## ⚠️ Nota Importante

**Cosa succede quando abiliti i signup:**

Quando un utente richiede l'OTP per modificare il profilo:

1. Se l'email NON ha un utente Auth → Supabase crea un utente Auth
2. L'utente riceve l'email OTP
3. Dopo la verifica, il nostro sistema usa il JWT custom (non l'auth di Supabase)

**Implicazione:**

- Si creeranno utenti "fantasma" nella tabella Auth Users
- Questi utenti NON hanno password
- NON possono fare login tradizionale
- Esistono solo per ricevere OTP

**È sicuro?** ✅ Sì, perché:

- Non hanno password
- Non possono accedere senza OTP
- Il nostro sistema usa JWT separati per l'editing

---

## 🎯 Alternativa: Non Creare Utenti Auth

Se NON vuoi creare utenti Auth, hai due opzioni:

### Opzione A: Usa Servizio Email Esterno

Torna a usare un servizio come Resend o SendGrid che invia email direttamente senza passare da Supabase Auth.

**Pro:**

- ✅ Nessun utente Auth creato
- ✅ Pieno controllo sull'email
- ✅ Template HTML completamente custom

**Contro:**

- ❌ Dipendenza esterna
- ❌ API key aggiuntiva
- ❌ Possibili costi

### Opzione B: Supabase Edge Function

Crea una Edge Function che invia email tramite SMTP senza usare Auth.

**Pro:**

- ✅ Rimane tutto in Supabase
- ✅ Nessun utente Auth
- ✅ SMTP custom

**Contro:**

- ❌ Più complesso da configurare
- ❌ Richiede configurazione SMTP

---

## 🚀 Raccomandazione

**Per semplicità e per far funzionare subito:**

✅ **Abilita "Allow new users to sign up"** in Supabase

Questo è l'approccio più semplice e funziona perfettamente. Gli utenti Auth "fantasma" non causano problemi perché:

- Non hanno password
- Non interferiscono con il sistema
- Possono essere puliti periodicamente se vuoi

---

## 🧹 Pulizia Utenti Fantasma (Opzionale)

Se vuoi rimuovere gli utenti Auth creati solo per OTP, puoi creare una funzione di pulizia:

```sql
-- Elimina utenti Auth che non hanno mai fatto login
-- e sono stati creati solo per OTP
DELETE FROM auth.users
WHERE
  last_sign_in_at IS NULL
  AND created_at < NOW() - INTERVAL '30 days';
```

**⚠️ Attenzione:** Assicurati che questi utenti non siano collegati a twin veri!

---

## 📝 Checklist Setup Completo

- [ ] Authentication → Providers → Email → **Enable Email OTP** ✅
- [ ] Authentication → Settings → **Allow new users to sign up** ✅
- [ ] Test: Richiedi OTP
- [ ] Verifica: Email ricevuta
- [ ] Verifica: OTP funziona nell'app

---

## 🐛 Se Ancora Non Funziona

### 1. Verifica Email Provider Setting

In Authentication → Settings:

- **Confirm email** → Disabilita (per OTP non serve)
- **Email Rate Limits** → Verifica di non aver raggiunto il limite

### 2. Controlla Supabase Logs

Dashboard → Logs → Auth Logs:

- Cerca errori relativi a email/OTP
- Verifica che la richiesta arrivi

### 3. Verifica Environment

Assicurati che `SUPABASE_SERVICE_ROLE_KEY` sia corretto in `.env.local`

---

## ✅ Soluzione Applicata

Una volta abilitato "Allow new users to sign up":

```bash
npm run dev

# Ora quando richiedi OTP:
✅ OTP sent successfully via Supabase Auth
📧 Email ricevuta
🔐 OTP CODE: 123456
```

**Funzionerà perfettamente!** 🎉
