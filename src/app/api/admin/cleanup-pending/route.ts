import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Delete expired pending automations
    const { error } = await supabase
      .from('pending_automations')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error cleaning up pending automations:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
