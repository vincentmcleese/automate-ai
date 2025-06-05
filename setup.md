# Quick Setup Guide

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Replace the values in your `.env.local` file

## 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://automate.ghostteam.ai/auth/callback` (for production)

## 4. Configure Supabase Auth

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable the Google provider
3. Add your Google OAuth Client ID and Client Secret
4. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

## 5. Test the Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and test the Google OAuth login flow.

## Troubleshooting

- **Build fails**: Make sure `.env.local` exists with valid Supabase credentials
- **OAuth errors**: Check that redirect URIs match in both Google Console and Supabase
- **Session issues**: Clear browser cookies and try again
