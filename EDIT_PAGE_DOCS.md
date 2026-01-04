# ✨ Modifica Profilo - Pagina Dedicata

## 🎯 Cosa è Stato Creato

La modifica del profilo ora è una **pagina dedicata** che replica esattamente il design della pagina del twin, ma con tutti i campi editabili.

## 📁 File Creati/Modificati

### Nuovi File

1. **`app/t/[slug]/edit/page.tsx`**
   - Pagina server-side che verifica il token di edit
   - Se token mancante → redirect al profilo principale
   - Carica twin e skills dal database

2. **`app/t/[slug]/edit/edit-client.tsx`**
   - Componente client con tutti i campi editabili
   - Replica esattamente il layout della pagina principale
   - Form gestito con state React

3. **`app/api/twins/edit/save-profile/route.ts`**
   - Nuovo endpoint API per salvare tutte le modifiche
   - Gestisce: display_name, photo, identity_summary, theme, skills
   - Verifica JWT token

### File Modificati

4. **`components/edit-twin-button.tsx`**
   - Ora fa redirect alla pagina `/t/[slug]/edit?token=XXX`
   - Non apre più un dialog
   - Gestisce ancora il flusso OTP iniziale

## 🎨 Features della Pagina di Edit

### Header con Banner Giallo
```
┌─────────────────────────────────────────────────┐
│ ⚡ Modalità Modifica    [Annulla] [Salva]      │
└─────────────────────────────────────────────────┘
```

### Campi Editabili

1. **Foto Profilo**
   - Click sull'icona upload per cambiare foto
   - Preview immediata
   - Supporto drag & drop

2. **Display Name**
   - Input grande al centro
   - Stile identico alla vista normale

3. **Identity Summary**
   - Textarea multi-riga
   - Descrizione breve del twin

4. **Tema Visivo**
   - Dropdown con tutti i temi disponibili:
     - Cosmic (Viola)
     - Sunset (Arancio)
     - Ocean (Blu)
     - Forest (Verde)
     - Rose (Rosa)
     - Midnight (Blu Scuro)

5. **Skills Tab**
   - Lista completa di skills
   - [+] Aggiungi Skill button
   - Ogni skill editabile:
     - Categoria
     - Nome
     - Livello (Beginner/Intermediate/Advanced/Expert)
     - Anni di esperienza
   - [🗑️] Elimina skill

6. **Tabs Read-Only**
   - Profilo: Visualizzazione del `ProfileTab` esistente
   - Documenti: Visualizzazione del `DocumentsTab` esistente

### Bottom Bar Sticky
```
┌─────────────────────────────────────────────────┐
│ 📷 Foto modificata • ✏️ Nome modificato        │
│                        [Annulla] [Salva]       │
└─────────────────────────────────────────────────┘
```

## 🔄 Flusso Utente Completo

### 1. Richiesta Modifica
```
Utente clicca "Modifica Profilo"
  ↓
Dialog per inserire email
  ↓
OTP inviato via email
  ↓
Utente inserisce OTP o clicca Magic Link
  ↓
Verifica OTP con Supabase Auth
  ↓
Genera JWT token
  ↓
Redirect a /t/[slug]/edit?token=XXX
```

### 2. Modifica

Sulla pagina di edit:
- Tutti i campi sono popolati con dati attuali
- Utente modifica ciò che vuole
- Vede preview in real-time (es. foto)
- Bottom bar mostra cosa è stato modificato

### 3. Salvataggio
```
Utente clicca "Salva Modifiche"
  ↓
Se foto modificata: Upload foto a Supabase Storage
  ↓
Chiama /api/twins/edit/save-profile con JWT
  ↓
Aggiorna twins table (name, photo, summary, theme)
  ↓
Aggiorna skills table (delete old + insert new)
  ↓
Success toast
  ↓
Redirect a /t/[slug] (profilo aggiornato)
```

## 🔐 Sicurezza

- **JWT Token**: Verifica ad ogni richiesta
- **Token Expiry**: 1 ora dalla verifica OTP
- **Authorization Header**: `Bearer <token>`
- **NoIndex**: La pagina edit non è indicizzata da Google

## 📱 Responsive

- Layout mobile-friendly
- Input responsive
- Bottom bar si adatta su mobile

## ✨ Indicatori Visivi

### Durante Modifica
- Yellow banner in alto
- Campi highlighted quando modificati
- Count modifiche nel bottom bar

### Durante Salvataggio
- Button disabled
- Spinner su "Salvataggio..."
- Toast progress per upload foto

### Successo
- Toast verde
- Redirect automatico
- Refresh dei dati

## 🎯 Miglioramenti Futuri Possibili

1. **Preview Live del Tema**
   - Cambiare il gradient in real-time quando si seleziona un tema

2. **Undo/Redo**
   - Stack delle modifiche con possibilità di tornare indietro

3. **Auto-Save**
   - Salvataggio automatico ogni N secondi

4. **Edit History**
   - Log delle modifiche precedenti

5. **Bulk Edit Skills**
   - Import/export skills da CSV

6. **Voice Edit Mode**
   - Usare VoiceAgent per modificare via voce

7. **Preview Mode**
   - Toggle tra edit e preview senza salvare

## 🧪 Come Testare

1. **Vai su** `/t/[slug]`
2. **Clicca** "Modifica Profilo"
3. **Inserisci** email e OTP
4. **Verifica** redirect a `/t/[slug]/edit?token=XXX`
5. **Modifica** alcuni campi
6. **Controlla** il bottom bar mostra le modifiche
7. **Clicca** "Salva Modifiche"
8. **Verifica** redirect e aggiornamento dati

## 🐛 Troubleshooting

### Token expired?
- L'utente deve richiedere un nuovo OTP
- JWT dura 1 ora

### Photo upload fails?
- Check file size < 5MB
- Check file type è immagine
- Check Supabase Storage configurato

### Skills not saving?
- Check che `skills` table esista
- Check RLS policies su skills table

---

**La pagina di edit è pronta e funzionale!** 🎉

