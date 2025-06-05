# Complete Setup Guide: Supabase + Google OAuth

This guide will walk you through setting up Google OAuth authentication with Supabase from scratch.

## Part 1: Create Supabase Project

### Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub/Google or create account with email
4. Click **"New Project"**
5. Choose your organization (or create one)
6. Fill in project details:
   - **Name**: `automate-ai` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
7. Click **"Create new project"**
8. Wait 2-3 minutes for project to be created

### Step 2: Get Supabase Credentials

1. In your new project dashboard, click **"Settings"** (gear icon) in left sidebar
2. Click **"API"** in the settings menu
3. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long token)

### Step 3: Create Environment File

1. In your project root, create `.env.local` file:

```bash
# Create the file
touch .env.local
```

2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Part 2: Setup Google Cloud Console

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the project dropdown (top left, next to "Google Cloud")
4. Click **"NEW PROJECT"**
5. Fill in project details:
   - **Project name**: `automate-ai-oauth` (or your preferred name)
   - **Organization**: Leave as default or select your org
6. Click **"CREATE"**
7. Wait for project creation, then select it from the dropdown

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"**
3. Click on **"Google+ API"** result
4. Click **"ENABLE"**
5. Wait for API to be enabled

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have Google Workspace)
3. Click **"CREATE"**
4. Fill in OAuth consent screen info:
   - **App name**: `AutomateAI` (or your app name)
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
   - **App logo**: Optional, can skip for now
   - **App domain**: Can leave blank for development
   - **Authorized domains**: Add `automate.ghostteam.ai` (for production)
5. Click **"SAVE AND CONTINUE"**
6. **Scopes**: Click **"SAVE AND CONTINUE"** (default scopes are fine)
7. **Test users**: Add your email for testing, click **"SAVE AND CONTINUE"**
8. **Summary**: Review and click **"BACK TO DASHBOARD"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"** as application type
4. Fill in details:
   - **Name**: `AutomateAI Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://automate.ghostteam.ai` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://automate.ghostteam.ai/auth/callback` (for production)
5. Click **"CREATE"**
6. **IMPORTANT**: Copy and save these credentials:
   - **Client ID**: `123456789-xxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

## Part 3: Connect Google OAuth to Supabase

### Step 1: Configure Google Provider in Supabase

1. Go back to your Supabase project dashboard
2. Click **"Authentication"** in left sidebar
3. Click **"Providers"** tab
4. Find **"Google"** in the list and click to expand it
5. Toggle **"Enable sign in with Google"** to ON
6. Fill in the Google credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
7. **Redirect URL**: This should show your Supabase URL like:
   `https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback`
   (Copy this URL - you'll need it in Google Cloud)
8. Click **"Save"**

### Step 2: Update Google Cloud Redirect URIs

1. Go back to Google Cloud Console > **"APIs & Services"** > **"Credentials"**
2. Click on your OAuth 2.0 Client ID to edit it
3. In **"Authorized redirect URIs"**, add the Supabase callback URL:
   - `https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback`
4. Your complete list should now be:
   - `http://localhost:3000/auth/callback` (your app - development)
   - `https://automate.ghostteam.ai/auth/callback` (your app - production)
   - `https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback` (Supabase)
5. Click **"SAVE"**

## Part 4: Test the Setup

### Step 1: Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 2: Test Authentication Flow

1. Open `http://localhost:3000` in your browser
2. Click **"Sign In"** or **"Get Started"**
3. Click **"Continue with Google"**
4. You should be redirected to Google's consent screen
5. Select your Google account and approve permissions
6. You should be redirected back to your app at `/dashboard`
7. You should see your Google profile information displayed

## Part 5: Verify Everything Works

### Check 1: Supabase Dashboard

1. In Supabase, go to **"Authentication"** > **"Users"**
2. You should see your user account listed
3. Click on the user to see details from Google

### Check 2: Browser Network Tab

1. Open browser dev tools (F12)
2. Go to Network tab
3. Perform login again
4. You should see successful requests to:
   - Google OAuth endpoints
   - Your `/auth/callback` endpoint
   - Supabase auth endpoints

### Check 3: Test Logout

1. Click on your avatar in the top right
2. Click **"Sign Out"**
3. You should be signed out and redirected to home page
4. Protected routes (like `/dashboard`) should redirect to login

## Troubleshooting Common Issues

### Issue 1: "redirect_uri_mismatch" error

**Solution**: Check that ALL redirect URIs match exactly:

- Google Cloud Console authorized redirect URIs
- URLs in your app code
- Supabase callback URL

### Issue 2: "unauthorized_client" error

**Solution**:

- Verify Client ID and Secret are correct in Supabase
- Check that OAuth consent screen is configured
- Ensure Google+ API is enabled

### Issue 3: "Access blocked" error

**Solution**:

- Add your email to test users in OAuth consent screen
- Check that app is not in production mode with unverified domain

### Issue 4: Environment variables not found

**Solution**:

- Verify `.env.local` file exists in project root
- Check that variable names match exactly
- Restart your development server after adding env vars

### Issue 5: "Invalid session" or authentication loops

**Solution**:

- Clear browser cookies and localStorage
- Check that Supabase project is active
- Verify environment variables are correct

## Production Deployment Notes

When deploying to production (`automate.ghostteam.ai`):

1. **Environment Variables**: Set the same Supabase credentials in your production environment
2. **Domain Verification**: You may need to verify `automate.ghostteam.ai` in Google Cloud Console
3. **OAuth Consent**: For public use, you'll need to submit your app for verification
4. **HTTPS**: Ensure your production site uses HTTPS (required for OAuth)

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Rotate secrets** regularly in production
3. **Use different** Supabase projects for development/production
4. **Monitor** authentication logs in Supabase dashboard
5. **Set up** proper CORS policies in production

Your Google OAuth authentication should now be fully functional! 🎉
