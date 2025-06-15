# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Architecture Overview

AutomateAI is a Next.js 15 application that uses AI to generate n8n workflow automations from natural language descriptions. The app uses:

- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **AI Generation**: OpenRouter API for workflow creation
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: React Context API for auth, local state for components

### Core Flow

1. **Landing Page** (`/`) - Users describe workflows via WorkflowBuilder component
2. **Validation** (`/generate-automation`) - Optional workflow validation and refinement
3. **Generation** - AI creates n8n JSON workflows using system prompts and training data
4. **Automation Management** - Users view/manage created automations in dashboard

### Key Architecture Components

**Authentication Flow**:

- `middleware.ts` protects routes and handles admin access
- `src/lib/auth/context.tsx` manages auth state globally
- Google OAuth with redirect handling for pending automations

**Database Structure**:

- `automations` table stores user workflows with RLS policies
- `system_prompts` and `training_data` for AI generation management
- `pending_automations` for unauthenticated user workflows

**AI Generation Pipeline**:

- `src/tasks/generateAutomation.ts` orchestrates the generation process
- Uses versioned system prompts with training data
- Generates metadata, images, and n8n workflow JSON
- Updates automation status: `generating` → `completed`/`failed`

**Admin System**:

- `/admin` routes for managing system prompts and training data
- ModelSelector component for choosing AI models
- Training data management with version control

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── automations/          # Automation CRUD operations
│   │   ├── admin/                # Admin API endpoints
│   │   └── auth/callback/        # OAuth callback handler
│   ├── admin/                    # Admin dashboard pages
│   ├── dashboard/                # User dashboard
│   └── automations/[id]/         # Individual automation pages
├── components/
│   ├── landing/                  # Home page components
│   │   └── WorkflowBuilder.tsx   # Main workflow creation interface
│   ├── auth/                     # Authentication components
│   ├── admin/                    # Admin-specific components
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth/context.tsx          # Authentication context
│   ├── supabase/                 # Database clients
│   └── openrouter/               # AI API client
├── tasks/
│   └── generateAutomation.ts     # AI workflow generation
└── types/                        # TypeScript definitions
```

## Important Development Notes

**Authentication**:

- Users can create "pending automations" without logging in
- OAuth flow preserves URL parameters (like `pendingAutomationId`)
- Admin access requires `app_metadata.role === 'admin'`

**Database**:

- All user data uses RLS policies
- Automations belong to users via `user_id` foreign key
- Status tracking: `generating`, `completed`, `failed`

**AI Generation**:

- System prompts are versioned and can be A/B tested
- Training data is dynamically included in prompts
- Generated workflows include n8n JSON, metadata, and images

**Styling**:

- Primary brand color: `#32da94` (green)
- Uses Tailwind CSS with custom design system
- Mobile-first responsive design
- shadcn/ui component library

**Testing**:

- Jest with React Testing Library
- Tests co-located with components
- Path alias `@/` maps to `src/`

## Environment Variables

Required for development:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=         # Admin operations (optional)
OPENROUTER_API_KEY=                # AI model access
```

## Database Migrations

Supabase migrations are in `supabase/migrations/`. Key tables:

- `automations` - User-created workflows
- `system_prompts` - AI generation prompts with versioning
- `training_data` - Examples for prompt training
- `pending_automations` - Unauthenticated user workflows

## Code Style & Conventions

- TypeScript strict mode enabled
- ESLint + Prettier with lint-staged hooks
- Component naming: PascalCase
- File naming: kebab-case for utilities, PascalCase for components
- Use `'use client'` directive for client components in App Router
- Prefer server components by default, client components only when needed
