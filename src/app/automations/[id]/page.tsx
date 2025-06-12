import { Suspense } from 'react'
import { AutomationContent } from '@/components/automations/AutomationContent'
import { createClient } from '@/lib/supabase/server'

interface AutomationPageProps {
  params: Promise<{
    id: string
  }>
}

// This page is now a simple shell. The client component will handle all data fetching.
export default async function AutomationPage({ params }: AutomationPageProps) {
  const { id } = await params
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
      <AutomationContent automationId={id} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: AutomationPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: automation } = await supabase
    .from('automations')
    .select('title, description, user_input')
    .eq('id', id)
    .single()

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
    title: `${title} | AutomateAI`,
    description:
      automation.description ||
      automation.user_input.slice(0, 160) + (automation.user_input.length > 160 ? '...' : ''),
  }
}
