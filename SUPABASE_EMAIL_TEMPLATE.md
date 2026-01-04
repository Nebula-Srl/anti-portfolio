# 📧 Supabase Email Template Configuration

## Il Problema

Supabase Auth genera automaticamente il suo OTP con `signInWithOtp()`, ma noi passiamo un OTP custom nei metadata (`data.otp_code`). Per assicurarci che l'OTP nell'email corrisponda a quello nel database, dobbiamo configurare il template email di Supabase per usare il nostro OTP custom.

## Soluzione: Template Email Personalizzato

### Step 1: Accedi a Supabase Dashboard

1. Vai su [app.supabase.com](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Nel menu laterale: **Authentication** → **Email Templates**

### Step 2: Seleziona "Magic Link"

Trova il template **"Magic Link"** (perché `signInWithOtp()` usa questo template)

### Step 3: Sostituisci il Template

Copia e incolla questo HTML nel template editor:

```html
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Codice di Verifica - Twino</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        background-color: #f5f5f5;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 20px;
        text-align: center;
        color: white;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 40px 30px;
      }
      .greeting {
        font-size: 18px;
        color: #333;
        margin-bottom: 20px;
      }
      .message {
        font-size: 16px;
        color: #555;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      .otp-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        margin: 30px 0;
      }
      .otp-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }
      .otp-code {
        font-size: 48px;
        font-weight: 700;
        color: white;
        letter-spacing: 8px;
        font-family: "Courier New", monospace;
        margin: 10px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      .alternative-section {
        margin-top: 30px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }
      .alternative-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
      }
      .magic-link {
        display: inline-block;
        padding: 12px 24px;
        background-color: #667eea;
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        margin-top: 10px;
        transition: background-color 0.3s;
      }
      .magic-link:hover {
        background-color: #5568d3;
      }
      .info-box {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 15px;
        margin-top: 20px;
      }
      .info-box p {
        margin: 0;
        font-size: 14px;
        color: #856404;
      }
      .footer {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
        font-size: 14px;
        color: #6c757d;
        border-top: 1px solid #e9ecef;
      }
      .footer a {
        color: #667eea;
        text-decoration: none;
      }
      .twin-info {
        display: inline-block;
        background-color: #e7f3ff;
        color: #0056b3;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1>🔐 Codice di Verifica</h1>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="greeting">
          Ciao{{ if .Data.twin_name }}, <strong>{{ .Data.twin_name }}</strong>{{
          end }}!
        </p>

        <p class="message">
          Hai richiesto di modificare il tuo profilo Digital Twin. Per procedere
          in modo sicuro, usa il codice di verifica qui sotto:
        </p>

        <!-- OTP Code -->
        <div class="otp-container">
          <div class="otp-label">Il tuo codice OTP</div>
          <div class="otp-code">{{ .Token }}</div>
        </div>

        <!-- Alternative: Magic Link -->
        <div class="alternative-section">
          <div class="alternative-title">💡 Oppure usa il link rapido:</div>
          <p style="font-size: 14px; color: #555; margin: 10px 0;">
            Clicca qui sotto per accedere direttamente alla modifica del profilo
            senza inserire il codice:
          </p>
          <a href="{{ .ConfirmationURL }}" class="magic-link">
            ✨ Accedi con Magic Link
          </a>
        </div>

        <!-- Warning Box -->
        <div class="info-box">
          <p>
            ⏰ <strong>Questo codice scade tra 15 minuti.</strong><br />
            🔒 Non condividere questo codice con nessuno.
          </p>
        </div>

        {{ if .Data.twin_slug }}
        <div style="text-align: center; margin-top: 20px;">
          <span class="twin-info">📍 Profilo: /t/{{ .Data.twin_slug }}</span>
        </div>
        {{ end }}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          Se non hai richiesto questa modifica, ignora questa email.<br />
          Il codice scadrà automaticamente dopo 15 minuti.
        </p>
        <p style="margin-top: 15px;">
          <strong>Twino</strong> - Il tuo Digital Twin Platform<br />
          <a href="{{ .SiteURL }}">{{ .SiteURL }}</a>
        </p>
      </div>
    </div>
  </body>
</html>
```

### Step 4: Configura le Variabili

Il template usa queste variabili che passiamo nel codice:

| Variabile                | Descrizione                       | Valore                      |
| ------------------------ | --------------------------------- | --------------------------- |
| `{{ .Token }}`           | **OTP generato da Supabase**      | Es: `525441`                |
| `{{ .Data.twin_name }}`  | Nome del twin                     | Es: `Developer Salvatore`   |
| `{{ .Data.twin_slug }}`  | Slug del profilo                  | Es: `developer-salvatore`   |
| `{{ .ConfirmationURL }}` | Magic link per accesso automatico | URL generato da Supabase    |
| `{{ .SiteURL }}`         | URL del sito                      | Es: `http://localhost:3000` |

### Step 5: Salva e Testa

1. Clicca **"Save"** in basso
2. Testa richiedendo un nuovo OTP
3. Controlla che l'OTP nell'email corrisponda a quello nei log del server

## Verifica Funzionamento

### Nel server log dovresti vedere:

```
🔑 Generated OTP: 814473 for twin: developer-salvatore
📝 Session created: abc-123 OTP stored: 814473
```

### Nell'email dovresti vedere:

```
Il tuo codice OTP
  814473
```

**I due OTP DEVONO corrispondere!** ✅

## Alternative: Email Service Personalizzato

Se vuoi un controllo totale, possiamo usare un servizio email esterno invece di Supabase Auth:

### Opzione A: Resend (Consigliato)

- Setup veloce
- Gratuito fino a 3,000 email/mese
- Template personalizzabili
- [resend.com](https://resend.com)

### Opzione B: SendGrid

- Più features
- Piano gratuito 100 email/giorno
- [sendgrid.com](https://sendgrid.com)

### Opzione C: NodeMailer

- Self-hosted
- Usa il tuo SMTP
- Controllo totale

**Vuoi che implementi una di queste alternative?** Fammi sapere!

## Risoluzione Problemi

### L'OTP nell'email è diverso da quello nel DB?

**Controlla:**

1. ✅ Hai salvato il template corretto in Supabase Dashboard?
2. ✅ Stai usando `{{ .Data.otp_code }}` e non `{{ .Token }}`?
3. ✅ Il campo nei metadata si chiama esattamente `otp_code`?

### L'email non arriva?

**Verifica:**

1. Controlla lo spam
2. Controlla i log di Supabase Dashboard → Authentication → Logs
3. Verifica che l'email di test sia confermata in Supabase

### Il Magic Link non funziona?

È normale! Il Magic Link usa il token di Supabase, non il nostro OTP.
Ma abbiamo implementato il supporto per entrambi:

- Puoi usare il Magic Link → redirect automatico
- Oppure inserire l'OTP manualmente

---

## 🎯 Prossimi Passi

1. [ ] Copia il template HTML sopra
2. [ ] Incollalo in Supabase Dashboard → Email Templates → Magic Link
3. [ ] Salva
4. [ ] Testa richiedendo un nuovo OTP
5. [ ] Verifica che l'OTP corrisponda

Fatto questo, il sistema funzionerà perfettamente! 🚀
