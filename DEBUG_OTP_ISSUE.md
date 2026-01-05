# 🐛 DEBUG: OTP Not Valid Issue

## Problem

User reports that OTP from email is marked as "not valid" even when copied and pasted correctly.

## Possible Root Causes

### 1. **Supabase Auth vs Custom OTP Mismatch** ⚠️ MOST LIKELY

**Problem:** The system generates a custom OTP and stores it in the database, but Supabase Auth's `signInWithOtp()` might be generating its own OTP code that gets sent in the email instead of our custom one.

**Evidence:**

- We generate OTP: `const otp = generateOTP()` (line 75)
- We store it in DB: `otp_token: otp` (line 83)
- We pass it to Supabase: `data: { otp_code: otp }` (line 119)
- **BUT:** Supabase Auth might ignore our custom OTP in `data` and generate its own

**Solution:**

- Check Supabase email template - is it using `{{ .Token }}` or `{{ .Data.otp_code }}`?
- If using `{{ .Token }}`, that's Supabase's auto-generated token, not ours!
- Need to ensure email template uses: `{{ .Data.otp_code }}`

### 2. **Whitespace/Formatting in Copy-Paste**

**Problem:** Email might have spaces, line breaks, or invisible characters

**Solution Implemented:**

```typescript
// Extract only digits from pasted data
const digitsOnly = pastedData.replace(/\D/g, "");
```

### 3. **Session ID Mismatch**

**Problem:** Different session ID being used for verification than creation

**Solution:** Added logging to trace session flow

### 4. **Database Type Mismatch**

**Problem:** OTP stored as number but compared as string (or vice versa)

**Check:** Ensure `otp_token` column in DB is `text` not `integer`

## Debugging Steps Added

### 1. Request OTP (`/api/twins/edit/request-otp`)

```
🔑 Generated OTP: 123456 for twin: developer-salvatore
📝 Session created: abc-123 OTP stored: 123456
```

### 2. Verify OTP (`/api/twins/edit/verify-otp`)

```
🔍 Verifying OTP - Session: abc-123
🔍 OTP in database: 123456
🔍 OTP from user: 123456
🔍 Match: true/false
```

### 3. Frontend Paste Handler

```
📋 Pasted OTP: "123456 " Length: 7
🔢 Digits only: "123456" Length: 6
```

### 4. Verify Request

```
🔐 Verifying OTP: 123456 for session: abc-123
📨 Verify response: { success: true/false, error: "..." }
```

## Testing Instructions

1. **Start the dev server** (check terminal for logs)
2. **Click "Modifica Profilo"**
3. **Enter email and request OTP**
4. **Check server logs** for:
   ```
   🔑 Generated OTP: XXXXXX
   📝 Session created: <session-id>
   ```
5. **Check your email** - what OTP code is shown?
6. **Copy OTP from email** (not the link, the 6-digit code)
7. **Paste into OTP field**
8. **Check browser console** for:
   ```
   📋 Pasted OTP: ...
   🔢 Digits only: ...
   🔐 Verifying OTP: ...
   ```
9. **Check server logs** for:
   ```
   🔍 Verifying OTP - Session: ...
   🔍 OTP in database: XXXXXX
   🔍 OTP from user: YYYYYY
   🔍 Match: false  <-- THIS IS THE ISSUE
   ```

## Expected Findings

### If OTP in database ≠ OTP from user:

- **Check email template** - is it showing Supabase's token or our custom one?
- **Fix:** Update email template to use `{{ .Data.otp_code }}`

### If OTP in database = OTP from user but still fails:

- **Check data types** - could be string vs number comparison
- **Check for leading zeros** - "012345" vs "12345"

### If session not found:

- **Check sessionId** being passed from frontend to backend
- **Check session expiration**

## Quick Fix if Supabase Auth is the Issue

**Option 1:** Don't use Supabase Auth's signInWithOtp, send custom email

- Use a service like Resend/SendGrid
- Full control over email content

**Option 2:** Extract OTP from Supabase Auth's verification

- Use Supabase's generated token instead of custom one
- Let Supabase handle the full OTP flow

**Option 3 (Recommended for now):** Log both and compare

- Add: `console.log('Supabase token:', authData)`
- See if Supabase returns their OTP token
- Verify email shows our custom OTP

## Next Steps

1. Run the test flow above
2. Share the console/server logs
3. Share what OTP code appears in the email
4. We'll identify the mismatch and fix it
