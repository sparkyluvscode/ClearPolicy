# How to Get Real API Keys for ClearPolicy

This guide walks you through getting API keys to enable live data (real bills, propositions, and representatives) instead of sample data.

## Step-by-Step: Get All Three Keys

### 1. Congress.gov API (Federal Bills & Legislation)

**What it does:** Searches federal bills and laws

**How to get it:**
1. Visit https://api.data.gov/signup/
2. Fill in:
   - Email address
   - Organization name (e.g., "High School Civic Project")
   - Use case (e.g., "Educational civic engagement app")
   - Check terms of service
3. Submit the form
4. **Wait for approval email** (can take 1-24 hours)
5. Once approved, you'll receive your API key
6. Copy the key
7. Open `clearpolicy/.env` in a text editor
8. Find `CONGRESS_API_KEY=your_api_data_gov_key`
9. Replace `your_api_data_gov_key` with your actual key

**Example:**
```
CONGRESS_API_KEY=abc123xyz456abc123xyz456
```

---

### 2. Open States API (State Bills & Propositions)

**What it does:** Searches California state legislation and propositions

**How to get it:**
1. Go to https://openstates.org/accounts/signup/
2. Create an account with email and password
3. Verify your email
4. Log in at https://openstates.org/
5. Go to https://openstates.org/api/keys/
6. Click "Generate API Key"
7. Copy the key that appears
8. Open `clearpolicy/.env`
9. Find `OPENSTATES_API_KEY=your_openstates_key`
10. Replace `your_openstates_key` with your actual key

**Example:**
```
OPENSTATES_API_KEY=os_key_abc123xyz
```

---

### 3. Google Civic Information API (Representatives by ZIP)

**What it does:** Looks up representatives for any ZIP code

**How to get it:**
1. Go to https://console.cloud.google.com/
2. Sign in with Google account
3. Click "Select a project" → "New Project"
4. Name it (e.g., "ClearPolicy") → "Create"
5. Wait for project creation (30 seconds)
6. In the search bar, type "Civic Information API"
7. Click "Civic Information API"
8. Click "Enable"
9. Go to "Credentials" (left sidebar)
10. Click "Create Credentials" → "API key"
11. Copy the API key
12. (Optional) Click "Restrict key" → select "Civic Information API" → "Save"
13. Open `clearpolicy/.env`
14. Find `GOOGLE_CIVIC_API_KEY=your_google_civic_key`
15. Replace `your_google_civic_key` with your actual key

**Example:**
```
GOOGLE_CIVIC_API_KEY=AIzaSyAbC123dEf456GhI789JkL
```

---

### 4. Clerk (Sign-in & Auth)

**What it does:** Powers sign-in, sign-up, and user sessions. Without real keys, the app runs in "keyless" mode (you may see a "Claim application" modal).

**How to get it:**
1. Go to https://dashboard.clerk.com/ and sign in (or create an account).
2. Create an application (or select an existing one).
3. In the dashboard, open **API Keys**.
4. Copy **Publishable key** and **Secret key**.
5. In `clearpolicy/.env.local`, set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...` (your publishable key)
   - `CLERK_SECRET_KEY=sk_test_...` (your secret key)
6. Restart the dev server. The "Clerk is in keyless mode" / "Claim application" message should go away, and sign-in/sign-up will be tied to your Clerk project and Dashboard.

**Optional:** If you already created a user in keyless mode, you can click **Claim application** in the modal to link this app to your Clerk account and manage users in the Dashboard.

---

## After Adding Keys

1. Save the `.env` file
2. **Restart the dev server:**
   ```bash
   cd /Users/pranilraichura/OpenPolicy/clearpolicy
   # Press Ctrl+C to stop current server
   npm run dev
   ```
3. Refresh the browser (http://localhost:3000)
4. The "Live data temporarily unavailable" banner should disappear
5. Search for a bill → you'll see real results!

---

## Verify Keys Are Working

Test each API:

1. **Congress.gov:** Search "health care" → should show real federal bills
2. **Open States:** Search "education" → should show real CA bills
3. **Google Civic:** Enter any ZIP (e.g., 95014) → should show real representatives

---

## Troubleshooting

**"API key missing" error:**
- Make sure you saved the `.env` file
- Restart the dev server after editing `.env`

**"Rate limit exceeded":**
- You're making too many requests too fast
- Wait 1 minute and try again
- Consider adding delays in searches

**Congress.gov approval pending:**
- Wait up to 24 hours for email approval
- Check spam folder

**No results showing:**
- The search might genuinely have no matches
- Try common terms like "health", "education", "environment"

---

## Free Tier Limits

All three APIs have free tiers suitable for testing:

- **Congress.gov:** Unlimited (educational/research use)
- **Open States:** 2,000 requests/day (free tier)
- **Google Civic:** 1,000 requests/day (free tier)

For CAC submission, these limits are more than enough.

---

## Submit to CAC Without Keys?

The app works with sample data for CAC! Judges understand that API approvals take time. You can:

1. Submit with sample data (app fully functional)
2. Mention in your demo video: "Live API integration ready; awaiting approval"
3. Note in submission materials that real keys will enable live data

The technical implementation is identical—only the data source changes.

