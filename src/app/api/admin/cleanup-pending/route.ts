import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminAuth, createSuccessResponse, createErrorResponse } from '@/lib/api/auth-helpers'

export const POST = withAdminAuth(async (_request: NextRequest, _user) => {
  const supabase = await createClient()

  // Delete expired pending automations
  const { error } = await supabase
    .from('pending_automations')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up pending automations:', error)
    return createErrorResponse('Cleanup failed', 500, error)
  }

  return createSuccessResponse({ message: 'Pending automations cleaned up successfully' })
})
