# 🔧 Fix: Magic Link invece di Codice OTP

## Il Problema

Supabase invia un **magic link** invece di mostrare il **codice OTP a 6 cifre**.

Quando l'utente clicca il link:

- Arriva a `localhost:3000/#access_token=...`
- Ma la nostra app NON gestisce magic links
- Si aspetta che l'utente **inserisca manualmente** il codice

Il codice OTP è nascosto nel JWT: `"otp_code":"525441"`

---

## ✅ Soluzione: Modifica Template Email

### Step 1: Vai al Template Email

1. **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Seleziona **"Magic Link"** (usato per OTP)
3. Modifica il template HTML

### Step 2: Sostituisci il Template

**Cancella tutto** e incolla questo:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Codice OTP Twino</title>
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
            style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
              >
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">
                  🔐 Codice di Verifica
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <p
                  style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;"
                >
                  Ciao <strong>{{ .Data.twin_name }}</strong>,
                </p>
                <p
                  style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;"
                >
                  Hai richiesto di modificare il tuo profilo Digital Twin. Ecco
                  il tuo codice OTP:
                </p>

                <!-- OTP CODE BOX -->
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
                  style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;"
                >
                  Il codice scade tra <strong>15 minuti</strong>
                </p>

                <p
                  style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;"
                >
                  <strong>Inserisci questo codice nell'applicazione</strong> per
                  continuare.<br />
                  Non cliccare link, usa solo il codice sopra.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;"
              >
                <p
                  style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;"
                >
                  Se non hai richiesto questo codice, ignora questa email.<br />
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

### Step 3: Salva

Click **"Save"** in basso.

---

## ⚠️ Nota Importante

Il template usa:

- `{{ .Data.twin_name }}` - Nome del twin (passiamo nel codice)
- `{{ .Data.otp_code }}` - Il codice OTP a 6 cifre

Questi valori vengono passati dal nostro codice in `request-otp/route.ts`:

```typescript
await supabase.auth.signInWithOtp({
  email: twin.email,
  options: {
    data: {
      otp_code: otp, // ← Questo!
      twin_name: twin.display_name, // ← Questo!
      twin_slug: twin.slug,
    },
    shouldCreateUser: true,
  },
});
```

---

## 🧪 Testa

1. **Salva** il template in Supabase
2. **Riavvia** l'app: `npm run dev`
3. **Richiedi** nuovo OTP
4. **Controlla** email

Dovresti vedere:

- ✅ Grande codice a 6 cifre
- ✅ Nessun link cliccabile
- ✅ Istruzioni chiare: "Inserisci il codice"

---

## 🎨 Personalizza (Opzionale)

Puoi modificare:

- **Colori**: Cambia `#667eea` e `#764ba2` con i tuoi colori brand
- **Logo**: Aggiungi un `<img>` nella sezione header
- **Testo**: Personalizza i messaggi

---

## 🚀 Alternativa: Usa Resend

Se preferisci non usare Supabase per le email:

1. **Disabilita** di nuovo il blocco `signInWithOtp` commentandolo
2. **Installa** Resend: `npm install resend`
3. **Configura** come prima

Resend ti dà:

- ✅ Controllo totale sul template
- ✅ Nessun magic link
- ✅ Nessun utente Auth creato
- ✅ Statistiche email

Vuoi che ripristino Resend?

---

## ✅ Risultato

Con il template corretto:

**Prima** ❌:

- Email con magic link
- Utente clicca → niente succede
- Confusione

**Dopo** ✅:

- Email con grande codice: `525441`
- Utente copia → incolla nell'app
- Funziona!

Applica il template e prova! 🎉
