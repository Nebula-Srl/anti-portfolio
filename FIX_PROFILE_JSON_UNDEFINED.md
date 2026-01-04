# ✅ Bug Fix: profile_json undefined

## 🐛 Problema
```
Cannot read properties of undefined (reading 'identity_summary')
```

## 🔍 Root Cause
Il campo `twin.profile_json` può essere `undefined` o `null` quando il twin non ha ancora completato l'intervista o non ha dati di profilo.

## ✅ Fix Applicati

### 1. `app/t/[slug]/edit/edit-client.tsx`
```typescript
// BEFORE ❌
const [identitySummary, setIdentitySummary] = useState(
  (twin.profile_json as TwinProfile).identity_summary || ''
)

// AFTER ✅
const profileJson = (twin.profile_json as TwinProfile) || {}
const [identitySummary, setIdentitySummary] = useState(
  profileJson.identity_summary || ''
)
```

### 2. `app/t/[slug]/page.tsx`
```typescript
// BEFORE ❌
{(twin.profile_json as TwinProfile).identity_summary && ...

// AFTER ✅
{twin.profile_json && 
 (twin.profile_json as TwinProfile).identity_summary && ...
```

### 3. Fix ProfileTab Props
```typescript
// BEFORE ❌
<ProfileTab twin={twin} readOnly />

// AFTER ✅
<ProfileTab 
  profile={profileJson} 
  displayName={displayName}
/>
```

### 4. Fix Skill Type
```typescript
// Rimosso campo inesistente: years_experience
// Aggiunto campo richiesto: source

const newSkill: Skill = {
  id: `temp-${Date.now()}`,
  twin_id: twin.id,
  category: "technical",
  skill_name: "Nuova Skill",
  proficiency_level: "intermediate",
  source: "interview", // ✅ Aggiunto
  created_at: new Date().toISOString(),
}
```

## 🧪 Test Cases

### Test 1: Twin senza profile_json
```typescript
twin.profile_json = undefined
// Result: ✅ Nessun errore, mostra descrizione di default
```

### Test 2: Twin con profile_json vuoto
```typescript
twin.profile_json = {}
// Result: ✅ Nessun errore, identity_summary = ''
```

### Test 3: Twin con profile_json completo
```typescript
twin.profile_json = {
  identity_summary: "Sviluppatore Full-Stack",
  thinking_patterns: "..."
}
// Result: ✅ Mostra identity_summary correttamente
```

## 📋 Checklist

- [x] Safe access a `profile_json` con fallback
- [x] Fix props di `ProfileTab`
- [x] Rimosso `years_experience` da Skill
- [x] Aggiunto `source` a Skill
- [x] Fix HTML entities (`&quot;`)
- [x] Rimosso import inutilizzati
- [x] Tutti i linter errors risolti

## ✅ Status
**RISOLTO** - La pagina di edit ora gestisce correttamente i twin senza profile_json completo.

