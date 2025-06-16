import { Suspense } from 'react'
import { AutomationContent } from '@/components/automations/AutomationContent'
import { createClient } from '@/lib/supabase/server'
import { isUUID } from '@/lib/utils/identifier'

interface AutomationPageProps {
  params: Promise<{
    id: string
  }>
}

// This page handles both UUID and slug identifiers
export default async function AutomationPage({ params }: AutomationPageProps) {
  const { id } = await params

  // Resolve identifier to automation ID
  let automationId = id

  // If it's a slug (not UUID), resolve it to get the actual ID
  if (!isUUID(id)) {
    const supabase = await createClient()
    const { data: automation } = await supabase
      .from('automations')
      .select('id')
      .eq('slug', id)
      .single()

    if (!automation) {
      // Slug not found, let the component handle the error
      automationId = id
    } else {
      automationId = automation.id
    }
  }

  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-text-secondary flex items-center space-x-2">
            <div className="border-brand-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
            <span>Loading automation...</span>
          </div>
        </div>
      }
    >
      <AutomationContent automationId={automationId} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: AutomationPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Handle both UUID and slug for metadata
  let query = supabase.from('automations').select('title, description, user_input, slug')

  if (isUUID(id)) {
    query = query.eq('id', id)
  } else {
    query = query.eq('slug', id)
  }

  const { data: automation } = await query.single()

  if (!automation) {
    return {
      title: 'Automation Not Found',
      description: 'The requested automation could not be found.',
    }
  }

  const title =
    automation.title ||
    automation.user_input.slice(0, 60) + (automation.user_input.length > 60 ? '...' : '')

  return {
    title: `${title} | Launch GhostTeam`,
    description:
      automation.description ||
      automation.user_input.slice(0, 160) + (automation.user_input.length > 160 ? '...' : ''),
  }
}
