# 📧 Supabase Plain Text Email Template

Se preferisci una versione più semplice o vuoi configurare anche il template plain text, usa questo:

```
============================================
🔐 CODICE DI VERIFICA - TWINO
============================================

Ciao{{ if .Data.twin_name }}, {{ .Data.twin_name }}{{ end }}!

Hai richiesto di modificare il tuo profilo Digital Twin.
Per procedere in modo sicuro, usa il codice di verifica qui sotto:

---------------------------------------
   IL TUO CODICE OTP

   {{ .Token }}
---------------------------------------

⏰ Questo codice scade tra 15 minuti.
🔒 Non condividere questo codice con nessuno.

OPPURE USA IL LINK RAPIDO:
{{ .ConfirmationURL }}

Clicca sul link sopra per accedere direttamente
alla modifica del profilo senza inserire il codice.

{{ if .Data.twin_slug }}
📍 Profilo: /t/{{ .Data.twin_slug }}
{{ end }}

---

Se non hai richiesto questa modifica, ignora questa email.
Il codice scadrà automaticamente dopo 15 minuti.

Twino - Il tuo Digital Twin Platform
{{ .SiteURL }}

============================================
```

## Come Configurarlo

### In Supabase Dashboard:

1. **Authentication** → **Email Templates**
2. Seleziona **"Magic Link"**
3. Se c'è un campo per "Plain Text" o un toggle per "Text Version", inserisci questo template
4. Salva

---

Questo garantisce che anche i client email che non supportano HTML ricevano un'email formattata correttamente!
