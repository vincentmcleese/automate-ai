# AutomateAI - Google OAuth Authentication

A Next.js application with Google OAuth authentication using Supabase Auth, featuring protected routes, user session management, and a modern UI.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Google accounts
- 🛡️ **Protected Routes** - Middleware-based route protection
- 👤 **User Session Management** - Persistent authentication state
- 🎨 **Modern UI** - Built with shadcn/ui components
- 📱 **Responsive Design** - Works on all device sizes
- 🚀 **Production Ready** - Configured for both development and production

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth with Google OAuth
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **State Management**: React Context API

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For additional security
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabase Setup

1. **Create a Supabase Project**:

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key

2. **Configure Google OAuth**:

   - In your Supabase dashboard, go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials:
     - Client ID: From Google Cloud Console
     - Client Secret: From Google Cloud Console

3. **Set Redirect URLs**:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://automate.ghostteam.ai/auth/callback`

### 3. Google Cloud Console Setup

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google+ API**:

   - Go to APIs & Services > Library
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**:

   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://automate.ghostteam.ai/auth/callback` (production)

4. **Copy Credentials**:
   - Copy Client ID and Client Secret
   - Add them to your Supabase Google provider settings

### 4. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 5. Production Deployment

The application is configured to work with the production domain `automate.ghostteam.ai`. The auth callback route automatically handles both development and production environments.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── callback/          # OAuth callback handler
│   │   └── auth-code-error/   # Error page for auth failures
│   ├── dashboard/             # Protected dashboard page
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Root layout with AuthProvider
├── components/
│   ├── auth/
│   │   ├── auth-modal.tsx     # Reusable auth modal
│   │   └── user-menu.tsx      # User dropdown menu
│   ├── layout/
│   │   └── header.tsx         # Navigation header
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth/
│   │   └── context.tsx        # Authentication context
│   └── supabase/
│       ├── client.ts          # Browser Supabase client
│       └── server.ts          # Server Supabase client
├── types/
│   └── auth.ts                # Authentication types
└── middleware.ts              # Route protection middleware
```

## Key Components

### Authentication Context (`src/lib/auth/context.tsx`)

- Manages user authentication state
- Provides login/logout functions
- Handles session persistence

### Middleware (`src/middleware.ts`)

- Protects `/dashboard` routes
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

### User Menu (`src/components/auth/user-menu.tsx`)

- Displays user avatar and info
- Provides logout functionality
- Shows login/register buttons for unauthenticated users

## Authentication Flow

1. **Login**: User clicks "Sign in with Google"
2. **OAuth**: Redirected to Google OAuth consent screen
3. **Callback**: Google redirects to `/auth/callback`
4. **Session**: Supabase exchanges code for session
5. **Redirect**: User redirected to dashboard or intended page

## Protected Routes

- `/dashboard/*` - Requires authentication
- Middleware automatically redirects unauthenticated users to `/login`
- Login page remembers the intended destination

## Error Handling

- **Auth Errors**: Handled by `/auth/auth-code-error` page
- **Network Errors**: Toast notifications via Sonner
- **Loading States**: Spinner components during auth operations

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Support

The application automatically detects the environment:

- **Development**: Uses `localhost:3000`
- **Production**: Uses `automate.ghostteam.ai`
- **Load Balancer**: Handles `x-forwarded-host` header

## Security Features

- **CSRF Protection**: Built into Supabase Auth
- **Secure Cookies**: HTTPOnly, Secure, SameSite
- **Session Refresh**: Automatic token refresh
- **Route Protection**: Middleware-based access control

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**:

   - Check Google Cloud Console redirect URIs
   - Ensure Supabase redirect URLs match

2. **"Authentication failed"**:

   - Verify Google OAuth credentials in Supabase
   - Check environment variables

3. **"Session not found"**:
   - Clear browser cookies
   - Check Supabase project status

### Debug Mode

Set `NODE_ENV=development` to see detailed error logs in the console.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication flow
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
