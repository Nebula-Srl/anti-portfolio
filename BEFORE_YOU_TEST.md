# 🚀 BEFORE YOU TEST - ACTION REQUIRED

## ⚠️ CRITICAL: Database Migration Must Be Run First

### Step 1: Run the SQL Migration

**YOU MUST DO THIS BEFORE TESTING** otherwise skills extraction won't work.

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Execute Migration**
   - Copy ALL contents from: `/migrations/create_skills_table.sql`
   - Paste into SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Or check the "Database" tab → "Tables" → Look for `skills` table

---

## ✅ Step 2: Verify Dependencies

The required package was already installed, but verify:

```bash
npm list @radix-ui/react-tabs
```

Should show: `@radix-ui/react-tabs@1.x.x`

If missing (unlikely):
```bash
npm install @radix-ui/react-tabs
```

---

## 🧪 Step 3: Test in Development

```bash
npm run dev
```

Then visit: `http://localhost:3000`

---

## 📝 Step 4: Quick Smoke Test

### Test 1: Modal (30 seconds)
1. Click "Crea il tuo Twin"
2. Fill slug and email
3. Close modal
4. Open again - fields should be empty ✅
5. Click outside modal - should NOT close ✅

### Test 2: Create Twin (3 minutes)
1. Open modal again
2. Enter slug: `test-twin-${Date.now()}`
3. Enter your email
4. Upload a small PDF (optional)
5. Click "Inizia intervista"
6. Say "Sono pronto" when prompted
7. Answer 2-3 questions
8. Wait for completion
9. Should redirect to twin page ✅

### Test 3: View Twin Tabs (1 minute)
1. On twin page, see 4 tabs at top ✅
2. Click each tab - should switch content ✅
3. On desktop, transcript sidebar visible ✅
4. Mobile: transcript hidden ✅

### Test 4: Skills Extraction (2 minutes)
1. Wait 30-60 seconds after twin creation
2. Go to "Competenze" tab
3. Initially: "Analisi in corso..." ⏳
4. Refresh page after 1 minute
5. Skills should appear organized by category ✅

---

## 🎯 What to Look For

### ✅ Good Signs
- Modal resets when reopened
- Can't close modal by clicking outside
- Interaction tips show on interview intro page
- All 4 tabs visible on twin page
- Transcript appears in right sidebar (desktop)
- Skills eventually populate after creation

### ❌ Red Flags
- Modal remembers old data
- Can close modal by clicking outside
- Tabs missing or broken layout
- Skills never appear (check migration was run)
- Errors in browser console
- Upload rejecting files under 25MB

---

## 🐛 If Something Goes Wrong

### Skills Not Appearing
**Cause**: Migration not run
**Fix**: Go back to Step 1 and run the SQL migration

### Modal Not Working
**Cause**: Cached old code
**Fix**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Tabs Not Showing
**Cause**: Package not installed
**Fix**: Run `npm install @radix-ui/react-tabs`

### TypeScript Errors
**Cause**: Type definitions out of sync
**Fix**: Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

### Upload Failing
**Cause**: File too large or wrong type
**Fix**: Use PDF under 25MB

---

## 📊 Expected Behavior Summary

| Feature | Before | After |
|---------|--------|-------|
| Modal validation | Real-time | On blur only |
| Modal close | Click anywhere | Button only |
| Upload limit | 10MB | 25MB |
| Twin page layout | Simple | Tabs interface |
| Transcript | Bottom | Right sidebar |
| Skills | Manual | Auto-extracted |
| Stop button | None | Red "Interrompi" |
| Documents view | None | Dedicated tab |
| Profile view | Inline | Dedicated tab |

---

## 🎬 Ready to Test?

1. ✅ SQL migration run in Supabase
2. ✅ Dependencies installed (`npm install` already done)
3. ✅ Development server running (`npm run dev`)
4. ✅ Browser open to `http://localhost:3000`

**You're all set! Start with the smoke tests above.** 🚀

---

## 📞 Need Help?

- **Technical Details**: See `IMPLEMENTATION_SUMMARY.md`
- **User Guide**: See `QUICK_START.md`
- **Migration Info**: See `migrations/README.md`
- **Full Plan**: See `.cursor/plans/twin_ux_&_skills_enhancement_*.plan.md`

---

## ⏱️ Estimated Testing Time

- **Smoke Tests**: 5-10 minutes
- **Full Feature Testing**: 20-30 minutes
- **Total Setup + Testing**: 30-40 minutes

**Most Important**: Run the SQL migration first! Everything else is ready to go. ✅

