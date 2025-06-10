import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Automation } from '@/types/admin'
import { AutomationContent } from '@/components/automations/AutomationContent'

interface AutomationPageProps {
  params: Promise<{
    id: string
  }>
}

async function getAutomation(id: string): Promise<Automation | null> {
  const supabase = await createClient()
  const { data: automation, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching initial automation:', error.message)
    return null
  }
  return automation
}

export default async function AutomationPage({ params }: AutomationPageProps) {
  const { id } = await params
  const automation = await getAutomation(id)

  if (!automation) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <div className="flex items-center space-x-2 text-[#6b7280]">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#32da94]"></div>
            <span>Loading automation...</span>
          </div>
        </div>
      }
    >
      <AutomationContent initialAutomation={automation} />
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
