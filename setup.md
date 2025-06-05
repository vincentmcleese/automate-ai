# Setup Instructions

## 1. Database Migration

Run the migration to set up admin schema:

```bash
supabase db push
```

This creates:

- `system_prompts` table for AI prompt management
- `openrouter_models` table for AI model configuration
- `admin_settings` table for global settings
- Row Level Security policies using `app_metadata` for admin roles

## 2. Setting Admin Role

Since we're using Supabase's `app_metadata` for admin roles, you can set admin privileges in several ways:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and click the edit button
3. In the "Raw app metadata" field, add:
   ```json
   {
     "role": "admin"
   }
   ```
4. Save changes

### Option B: Using SQL (Service Role Required)

Run this SQL query using the service role key:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
                       jsonb_build_object('role', 'admin')
WHERE email = 'your-admin-email@example.com';
```

### Option C: Using the built-in function

If you have service role access:

```sql
SELECT set_user_admin_role('your-admin-email@example.com');
```

### Option D: Using Admin API (After Setup)

Once you have one admin user, you can use the admin panel to promote other users:

```bash
curl -X PATCH /api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "user@example.com", "role": "admin"}'
```

## 3. Environment Variables

Ensure you have these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_SERVICE_ROLE_SUPABASE_KEY=your_service_role_key  # Required for advanced admin features
NEXT_OPENROUTER_API_KEY=your_openrouter_api_key  # Optional: for AI features
```

### Why Service Role Key is Important:

- **User Management**: List all users, update roles programmatically
- **Enhanced Security**: Server-side user operations with full privileges
- **Admin Dashboard Stats**: Real-time user statistics and analytics
- **Bulk Operations**: Manage multiple users efficiently

## 4. Access Admin Panel

Once admin role is set:

1. Sign in to your application
2. You'll see an "Admin Panel" option in the user menu
3. Navigate to `/admin` to access admin features

## 5. Admin Features

### With Service Role Key (Full Features):

- **System Prompts**: Full CRUD operations for AI prompts
- **AI Models**: Model management with OpenRouter sync
- **User Management**:
  - View all users with roles and status
  - Promote/demote user roles
  - User statistics dashboard
  - Account status monitoring
- **Settings**: Global application configuration
- **Analytics**: User signup trends, admin counts, etc.

### Without Service Role Key (Limited):

- **System Prompts**: Basic CRUD operations
- **AI Models**: Model management (limited sync)
- **Users**: View-only (no role management)
- **Settings**: Basic configuration

## 6. API Endpoints

### User Management (Requires Service Role):

- `GET /api/admin/users` - List all users
- `GET /api/admin/users?stats=true` - Get user statistics
- `PATCH /api/admin/users` - Update user roles

### System Prompts:

- `GET /api/admin/system-prompts` - List prompts
- `POST /api/admin/system-prompts` - Create prompt
- `GET /api/admin/system-prompts/[id]` - Get specific prompt
- `PUT /api/admin/system-prompts/[id]` - Update prompt
- `DELETE /api/admin/system-prompts/[id]` - Delete prompt

### Models:

- `GET /api/admin/models` - List models
- `GET /api/admin/models?sync=true` - Sync with OpenRouter
- `POST /api/admin/models` - Add custom model

## Security Notes

- Admin roles are stored in `app_metadata` which can only be modified server-side
- All admin API routes verify the `app_metadata.role` from the JWT token
- Row Level Security policies protect database access
- Middleware protects admin routes at the application level
- Service role operations are logged and auditable
- Users cannot promote themselves to admin through the UI
