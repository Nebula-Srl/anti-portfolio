# 🔐 Supabase OTP Setup - Guida Completa

## Configurazione OTP Email in Supabase

Il sistema usa Supabase Auth per inviare codici OTP via email. Segui questa guida per abilitarlo.

---

## 📋 Setup Rapido (5 minuti)

### Step 1: Abilita Email OTP in Supabase

1. Vai su **Supabase Dashboard** (https://app.supabase.com)
2. Seleziona il tuo progetto
3. Nel menu laterale, vai su **Authentication**
4. Click sulla tab **Providers**
5. Trova la sezione **Email**
6. Attiva le seguenti opzioni:
   - ✅ **Enable Email provider**
   - ✅ **Enable Email OTP**

7. Ora vai sulla tab **Settings** (o Configuration)
8. Trova la sezione **"User Signups"** o **"Auth Settings"**
9. Attiva: ✅ **"Allow new users to sign up"**
   
   ⚠️ **Importante**: Questo permette a Supabase di creare utenti Auth temporanei per l'OTP. Senza questo, riceverai l'errore "Signups not allowed for otp".

10. **Salva** tutte le modifiche

**Screenshot reference paths:**
```
1. Dashboard → Authentication → Providers → Email → Enable Email OTP
2. Dashboard → Authentication → Settings → Allow new users to sign up
```

---

### Step 2: Configura Email Template (Opzionale)

Puoi personalizzare l'email che gli utenti riceveranno:

1. In **Authentication**, vai su **Email Templates**
2. Seleziona **Magic Link** (usato per OTP)
3. Personalizza il template HTML con:
   - Il tuo logo
   - I colori del tuo brand
   - Testo personalizzato

**Variabili disponibili nel template:**
- `{{ .Token }}` - Il codice OTP (usa questo!)
- `{{ .SiteURL }}` - URL del tuo sito
- `{{ .ConfirmationURL }}` - Link di conferma
- `{{ .Data.twin_name }}` - Nome del twin (passato dall'app)

**Template Esempio:**
```html
<h2>Codice di Verifica Twino</h2>
<p>Ciao {{ .Data.twin_name }},</p>
<p>Il tuo codice OTP per modificare il profilo è:</p>
<h1 style="font-size: 36px; letter-spacing: 8px;">{{ .Token }}</h1>
<p>Il codice scade tra 15 minuti.</p>
```

---

### Step 3: Configura SMTP (Opzionale - Produzione)

Per produzione, è consigliato usare il tuo server SMTP invece del servizio email di default di Supabase.

**Opzioni SMTP:**
1. **Gmail** (per testing)
2. **SendGrid**
3. **AWS SES**
4. **Mailgun**
5. **Postmark**

**Come configurare:**

1. In **Authentication** → **Email Templates**
2. Scroll in basso a **SMTP Settings**
3. Attiva **Enable Custom SMTP**
4. Inserisci i dettagli del tuo provider:
   - Host
   - Port
   - Username
   - Password
   - Sender email
   - Sender name

---

### Step 4: Verifica Funzionamento

1. Riavvia il server (se già in esecuzione):
   ```bash
   npm run dev
   ```

2. Nell'app:
   - Click **"Modifica Profilo"**
   - Inserisci email
   - Click **"Invia Codice OTP"**

3. Controlla:
   - ✅ Console del server (dovresti vedere "✅ OTP sent successfully")
   - ✅ Inbox email (ricevi il codice OTP)
   - ✅ Cartella Spam (se non vedi l'email)

---

## 🐛 Troubleshooting

### Errore: "Signups not allowed for otp"

**Problema:** Hai abilitato Email OTP ma ricevi ancora questo errore.

**Causa:** I signup sono disabilitati in Supabase. L'API `signInWithOtp()` cerca di creare un utente Auth se non esiste, ma i signup sono bloccati.

**Soluzione:**
1. Vai su Supabase Dashboard
2. Authentication → **Settings** (o Configuration)
3. Trova "User Signups" o "Auth Settings"
4. Attiva **"Allow new users to sign up"** ✅
5. Salva e riprova

**Nota:** Questo creerà utenti Auth "temporanei" per l'OTP. Questi utenti:
- Non hanno password
- Non possono fare login tradizionale
- Servono solo per ricevere OTP
- Sono sicuri (non causano problemi)

📖 **Guida dettagliata**: Vedi `FIX_SUPABASE_OTP_ERROR.md`

---

### Email non arriva

**Possibili cause e soluzioni:**

**1. Email finisce in Spam**
- Controlla la cartella Spam/Junk
- Aggiungi `noreply@mail.app.supabase.io` ai contatti

**2. Email provider blocca Supabase**
- Alcuni provider (es. Outlook) potrebbero bloccare email di Supabase
- Soluzione: Configura SMTP custom

**3. Limite rate raggiunto**
- Supabase ha limiti sul numero di email
- Piano gratuito: Limitato
- Soluzione: Upgrade piano o usa SMTP custom

**4. Template email non valido**
- Se hai personalizzato il template, verifica la sintassi
- Riprova con il template di default

---

### OTP non viene loggato in console

**Problema:** Non vedi l'OTP nella console del server.

**Soluzione:**
Il codice OTP viene sempre loggato, controlla:
```
============================================================
🔐 OTP CODE
============================================================
OTP Code: 123456
============================================================
```

Se non lo vedi, verifica che il server sia in esecuzione.

---

### Errore "Auth session missing"

**Problema:** Supabase non riesce a creare la sessione OTP.

**Soluzione:**
1. Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia in `.env.local`
2. Verifica che la chiave sia corretta
3. Riavvia il server

---

## 🔧 Configurazione Avanzata

### Rate Limiting

L'app ha già implementato rate limiting (max 3 richieste OTP ogni 10 minuti per email).

Per modificare i limiti, vedi:
```typescript
// In app/api/twins/edit/request-otp/route.ts
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
// Cambia 10 per modificare il periodo
// Cambia 3 nella condizione per modificare il numero massimo di tentativi
```

### Durata OTP

Di default, l'OTP scade dopo 15 minuti. Per modificare:

1. In `database-updates.sql`:
```sql
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
-- Cambia '15 minutes' con la durata desiderata
```

2. In Supabase Dashboard → Authentication → Providers → Email:
   - **Token expiry duration** (in secondi)

---

## 📊 Monitoraggio

### Supabase Logs

Monitora l'invio email:

1. Vai su **Supabase Dashboard**
2. Nel menu laterale, click **Logs**
3. Seleziona **Auth Logs**
4. Filtra per "otp" o "magic_link"

### Console App

Durante lo sviluppo, ogni OTP viene loggato:
```
✅ OTP sent successfully via Supabase Auth
🔐 OTP CODE: 123456
```

---

## 🚀 Produzione

### Checklist Produzione

- [ ] Email OTP abilitato in Supabase
- [ ] SMTP custom configurato (consigliato)
- [ ] Email template personalizzato
- [ ] Test invio email completato
- [ ] Verificato che email non finisca in spam
- [ ] Rate limiting testato
- [ ] Logs monitorati

### Best Practices

1. **Usa SMTP Custom**
   - Più affidabile del servizio default
   - Migliore deliverability
   - Email non finiscono in spam

2. **Monitora Logs**
   - Controlla regolarmente Supabase Auth Logs
   - Alert per errori di invio email

3. **Backup Plan**
   - Tieni sempre il codice OTP loggato in console (per debugging)
   - Considera un sistema di recupero alternativo

---

## 📧 Template Email Consigliato

Template HTML professionale per l'email OTP:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codice OTP Twino</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Codice di Verifica</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Ciao <strong>{{ .Data.twin_name }}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Hai richiesto di modificare il tuo profilo Digital Twin. Ecco il tuo codice OTP:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px; background-color: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">
                      {{ .Token }}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
                Il codice scade tra <strong>15 minuti</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Se non hai richiesto questo codice, ignora questa email.<br>
                Nessuno potrà modificare il tuo profilo senza questo codice.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Copia questo template in:
**Supabase Dashboard → Authentication → Email Templates → Magic Link**

---

## ✅ Checklist Finale

Prima di andare in produzione:

- [ ] Email OTP abilitato ✅
- [ ] Template email configurato ✅
- [ ] Test completo eseguito ✅
- [ ] Email ricevuta correttamente ✅
- [ ] Email non in spam ✅
- [ ] SMTP custom configurato (opzionale) ✅
- [ ] Rate limiting testato ✅
- [ ] Logs verificati ✅

---

**Setup completato! Gli utenti possono ora ricevere OTP via email per modificare i loro profili! 🎉**

