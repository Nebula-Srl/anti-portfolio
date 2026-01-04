# 🎯 Quick Setup Guide - Email Template

## ⚡ Setup Rapido (5 minuti)

### 1️⃣ Apri Supabase Dashboard

```
https://app.supabase.com → [Il tuo progetto] → Authentication → Email Templates
```

### 2️⃣ Seleziona "Magic Link"

È il template usato da `signInWithOtp()`

### 3️⃣ Copia il Template HTML

Apri il file: `SUPABASE_EMAIL_TEMPLATE.md`
Copia tutto il codice HTML (dalla riga `<!DOCTYPE html>` fino a `</html>`)

### 4️⃣ Incolla in Supabase

Sostituisci completamente il contenuto del template con il nostro

### 5️⃣ Salva

Clicca il pulsante **Save** in basso

### 6️⃣ Testa!

```bash
# Nel tuo terminale, richiedi un nuovo OTP
# Controlla i log per vedere l'OTP generato:
🔑 Generated OTP: 123456

# Controlla l'email - dovrebbe mostrare lo stesso: 123456
```

---

## 🔍 Cosa Cambia

### ❌ PROBLEMA: OTP Custom vs Supabase OTP

```javascript
// Noi generavamo: 272733
// Supabase inviava: 525441
// ❌ Non corrispondevano!
```

### ✅ SOLUZIONE: Usa l'OTP di Supabase

```html
<div class="otp-code">{{ .Token }}</div>
<!-- .Token = OTP generato e inviato da Supabase (es. 525441) -->
```

**Risultato:** L'OTP nell'email è sempre verificabile con Supabase Auth ✅

---

## 📋 Checklist

- [ ] Aperto Supabase Dashboard
- [ ] Navigato a Authentication → Email Templates
- [ ] Selezionato "Magic Link"
- [ ] Copiato il template HTML da `SUPABASE_EMAIL_TEMPLATE.md`
- [ ] Incollato nel template editor
- [ ] Salvato
- [ ] Testato richiedendo un nuovo OTP
- [ ] Verificato che l'OTP nell'email corrisponda ai log

---

## 🎨 Preview Email

L'email avrà questo aspetto:

```
┌─────────────────────────────────────┐
│  🔐 Codice di Verifica              │  ← Header viola sfumato
├─────────────────────────────────────┤
│                                     │
│  Ciao, Developer Salvatore!        │
│                                     │
│  Hai richiesto di modificare il    │
│  tuo profilo Digital Twin...       │
│                                     │
│  ┌───────────────────────────┐     │
│  │  IL TUO CODICE OTP        │     │  ← Box evidenziato
│  │                           │     │
│  │      814473               │     │  ← OTP in grande
│  │                           │     │
│  └───────────────────────────┘     │
│                                     │
│  💡 Oppure usa il link rapido:    │
│                                     │
│  [✨ Accedi con Magic Link]        │  ← Bottone cliccabile
│                                     │
│  ⚠️ Questo codice scade tra       │
│     15 minuti                      │
│                                     │
│  📍 Profilo: /t/developer-...     │
│                                     │
├─────────────────────────────────────┤
│  Footer con info                   │
└─────────────────────────────────────┘
```

---

## 🆘 Hai Problemi?

### L'OTP ancora non corrisponde?

1. Verifica di aver salvato correttamente il template
2. Svuota la cache del browser
3. Richiedi un nuovo OTP (non usare quelli vecchi)
4. Controlla i log del server

### Non ricevi l'email?

1. Controlla spam/promozioni
2. Verifica in Supabase Dashboard → Auth → Logs
3. Assicurati che "Email OTP" sia abilitato

### Il Magic Link non funziona?

È normale! Abbiamo implementato il supporto per entrambi:

- ✅ Inserimento manuale OTP (sempre funziona)
- ✅ Magic Link (redirect automatico se cliccato)

---

## 🚀 Quando Tutto Funziona

Vedrai nei log:

```
🔑 Generated OTP: 814473 for twin: developer-salvatore
📝 Session created: abc-123 OTP stored: 814473

🔐 Attempting Supabase Auth verification with email: user@email.com
📧 Supabase Auth verification result: { success: true }
✅ Supabase Auth OTP verification successful
```

E l'utente potrà:

1. ✅ Copiare l'OTP dall'email
2. ✅ Incollarlo nel form
3. ✅ Accedere alla modifica del profilo
4. ✅ OPPURE cliccare il Magic Link per accesso immediato

**Tutto pronto!** 🎉
