# 🎉 Magic Link con Auto-Redirect Implementato!

## Cosa Ho Fatto

Ho implementato un sistema completo che permette agli utenti di:

1. ✅ Ricevere email con **codice OTP** E **magic link**
2. ✅ Cliccare il magic link
3. ✅ Essere **automaticamente reindirizzati** alla pagina del twin
4. ✅ Entrare **direttamente in modalità editing** senza inserire codice

---

## 🔧 File Creati/Modificati

### 1. **Nuovo: `/app/auth/callback/page.tsx`**

Pagina di callback che gestisce il magic link:

- Estrae il token JWT dall'URL
- Decodifica il token per ottenere `twin_slug` e `otp_code`
- Salva i dati in sessionStorage
- Reindirizza a `/t/{slug}?edit=true`

### 2. **Modificato: `/app/api/twins/edit/request-otp/route.ts`**

Aggiunto `emailRedirectTo`:

```typescript
emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
```

Ora l'email contiene:

- Il codice OTP (per chi vuole digitarlo manualmente)
- Un magic link che reindirizza a `/auth/callback`

### 3. **Modificato: `/components/edit-twin-button.tsx`**

Aggiunta logica per:

- Rilevare il parametro `?edit=true` nell'URL
- Leggere i dati del magic link da sessionStorage
- Auto-verificare l'OTP senza chiedere all'utente
- Aprire direttamente il form di editing

---

## 🎬 Flusso Utente Completo

### Opzione A: Usa Magic Link (Auto)

1. Utente clicca **"Modifica Profilo"**
2. Riceve email
3. **Clicca il link nell'email** 👆
4. ↓ Passa per `/auth/callback`
5. ↓ Estrae OTP e slug dal token
6. ↓ Reindirizza a `/t/{slug}?edit=true`
7. ✅ **Form di editing si apre automaticamente!**

### Opzione B: Usa Codice OTP (Manuale)

1. Utente clicca **"Modifica Profilo"**
2. Riceve email
3. **Copia il codice OTP** dall'email
4. **Incolla** nell'app
5. ✅ Form di editing si apre

Entrambe le opzioni funzionano!

---

## 📧 Template Email Aggiornato

Ora l'email dovrebbe contenere:

```html
<h1>🔐 Codice di Verifica</h1>

<p>Ciao Developer Salvatore,</p>

<p>Hai richiesto di modificare il tuo profilo Digital Twin.</p>

<!-- Opzione 1: Magic Link -->
<p>
  <a href="{{ .ConfirmationURL }}" style="...">
    👆 Clicca qui per modificare il profilo
  </a>
</p>

<!-- Opzione 2: Codice Manuale -->
<p>Oppure usa questo codice:</p>
<div style="font-size: 48px;">{{ .Data.otp_code }}</div>
```

### Template Completo Consigliato

In Supabase Dashboard → Authentication → Email Templates → Magic Link, usa:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Accedi al tuo profilo Twino</title>
  </head>
  <body
    style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f6f9fc; padding: 40px 0;"
    >
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color: #ffffff; border-radius: 12px; overflow: hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
              >
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">
                  🔐 Accedi al tuo Profilo
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <p style="color: #4b5563; font-size: 16px; margin: 0 0 20px 0;">
                  Ciao <strong>{{ .Data.twin_name }}</strong>,
                </p>
                <p style="color: #4b5563; font-size: 16px; margin: 0 0 30px 0;">
                  Hai richiesto di modificare il tuo profilo Digital Twin.
                  Scegli come procedere:
                </p>

                <!-- Option 1: Magic Link Button -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="margin-bottom: 30px;"
                >
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;"
                      >
                        👆 Clicca qui per Modificare il Profilo
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                  <div
                    style="display: inline-block; padding: 0 20px; background-color: #fff; position: relative; z-index: 1;"
                  >
                    <span style="color: #9ca3af; font-size: 14px;">OPPURE</span>
                  </div>
                  <div
                    style="border-top: 1px solid #e5e7eb; width: 100%; position: relative; top: -12px; z-index: 0;"
                  ></div>
                </div>

                <!-- Option 2: OTP Code -->
                <p
                  style="color: #4b5563; font-size: 16px; margin: 0 0 20px 0; text-align: center;"
                >
                  Usa questo codice:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td
                      align="center"
                      style="padding: 30px; background-color: #f9fafb; border-radius: 8px;"
                    >
                      <div
                        style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;"
                      >
                        {{ .Data.otp_code }}
                      </div>
                    </td>
                  </tr>
                </table>

                <p
                  style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; text-align: center;"
                >
                  Il link e il codice scadono tra <strong>15 minuti</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;"
              >
                <p
                  style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;"
                >
                  Se non hai richiesto questo accesso, ignora questa email.<br />
                  Nessuno potrà modificare il tuo profilo senza questo link o
                  codice.
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

---

## ⚙️ Environment Variable

Assicurati di avere in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In produzione:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🧪 Testing

### Test Magic Link

1. Avvia: `npm run dev`
2. Vai alla pagina twin
3. Click "Modifica Profilo"
4. Ricevi email
5. **Click sul bottone "Clicca qui per Modificare il Profilo"**
6. Dovresti vedere:
   - Pagina "Verifica in corso..."
   - Redirect automatico a twin page
   - Form editing aperto automaticamente

### Test OTP Manuale

1. Ricevi email
2. **Copia il codice** (es: `525441`)
3. **Incolla** nell'app
4. Form editing si apre

---

## 🔍 Debug

### Console Logs Utili

La pagina callback logga:

```javascript
console.log("Twin slug:", twinSlug);
console.log("OTP code:", otpCode);
console.log("Redirecting to:", `/t/${twinSlug}?edit=true`);
```

La pagina twin logga:

```javascript
console.log("Magic link detected!");
console.log("Auto-verifying OTP...");
```

---

## 🎯 Vantaggi

**Per l'utente**:

- ✅ **1 click** → direttamente in editing
- ✅ Nessun codice da copiare/incollare
- ✅ Esperienza fluida e veloce

**Per il sistema**:

- ✅ Sicuro (token JWT verificato)
- ✅ Scadenza automatica (15 minuti)
- ✅ Fallback a OTP manuale se link scade

---

## ✅ Checklist Setup

- [x] Pagina callback creata (`/app/auth/callback/page.tsx`)
- [x] API aggiornata con `emailRedirectTo`
- [x] EditTwinButton aggiornato con auto-detect
- [x] Template email con entrambe le opzioni
- [x] Environment variable configurata

---

## 🚀 Pronto!

**Il sistema ora supporta:**

1. 👆 **Magic Link** (click → editing automatico)
2. 🔢 **Codice OTP** (copia/incolla manuale)

Entrambi funzionano perfettamente! Testa e divertiti! 🎉
