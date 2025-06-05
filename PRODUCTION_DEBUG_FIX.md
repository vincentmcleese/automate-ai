# Production Debug Issue: System Prompt Retrieval

## Problem

The system prompt retrieval was failing in production at `https://automate.ghostteam.ai/debug` with an "unknown error", while it works fine in localhost.

## Root Cause

The issue was caused by **incorrect environment variables** in production. The Supabase connection wasn't working properly due to misconfigured environment variables.

### Secondary Issue: Authentication Requirements

The system also had Row Level Security (RLS) policies that required authentication to access system prompts, which prevented public access to the workflow validation functionality.

### Specific Issues:

1. **Environment Variables**: Incorrect Supabase credentials or API keys in production
2. **RLS Policy Restriction**: The original policy only allowed authenticated users to read active prompts:

   ```sql
   CREATE POLICY "Authenticated users can read active prompts" ON system_prompts
       FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
   ```

3. **Public Access Needed**: The workflow validation should work for anonymous users without requiring sign-up

## Solution

### 1. Environment Variables (RESOLVED)

✅ Fixed incorrect environment variables in production

### 2. Public Access to Workflow Validation

Added a specific policy to allow public access to the `workflow_validation` prompt:

```sql
CREATE POLICY "Public can read workflow validation prompt" ON system_prompts
    FOR SELECT USING (name = 'workflow_validation' AND is_active = true);
```

### 3. Updated API Endpoint

Modified `/src/app/api/workflow/validate/route.ts` to:

- Allow unauthenticated requests for workflow validation
- Handle missing user context gracefully
- Provide helpful error messages for both authenticated and anonymous users
- Log authentication status without treating it as an error

### 4. Database Migration

Created migration file: `supabase/migrations/20240101000003_fix_workflow_validation_access.sql`

## Current Functionality

The workflow validation endpoint (`/api/workflow/validate`) now supports:

✅ **Anonymous users** - Can validate workflows without signing up  
✅ **Authenticated users** - Can validate workflows while logged in  
✅ **Debug mode** - Works for both authenticated and anonymous users

## Deployment Steps

1. **Apply the database migration**:

   ```bash
   supabase db push
   ```

2. **Deploy the updated API code** with public access support

3. **Test the endpoints**:
   - `https://automate.ghostteam.ai/debug` (debug diagnostics)
   - `https://automate.ghostteam.ai/` (main workflow validation)

## Security Considerations

The new policy only allows public read access to:

- The specific `workflow_validation` prompt
- Only when it's active (`is_active = true`)
- No other system prompts are exposed
- Admin functionality still requires authentication

This maintains security while allowing public workflow validation.

## Benefits

1. **Better User Experience**: Users can try the service without signing up
2. **Reduced Friction**: No authentication barrier for the core validation feature
3. **Debug Access**: Easier troubleshooting of production issues
4. **Maintained Security**: Admin and sensitive operations still protected

## Prevention

To prevent similar issues in the future:

1. Test RLS policies in production-like environments
2. Always consider authentication requirements for debug/admin endpoints
3. Monitor production logs for RLS-related errors
4. Document which endpoints require authentication vs public access
