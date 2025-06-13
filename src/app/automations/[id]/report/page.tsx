import { createClient } from '@/lib/supabase/server'
import { AutomationReport } from '@/components/automations/AutomationReport'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

interface AutomationReportPageProps {
  params: {
    id: string
  }
}

async function getReportData(automationId: string) {
  const supabase = await createClient()

  const { data: automation, error } = await supabase
    .from('automations')
    .select(
      `
      *,
      tools(*),
      system_prompts(
        *,
        system_prompt_training_data(*)
      )
    `
    )
    .eq('id', automationId)
    .single()

  if (error || !automation) {
    notFound()
  }

  return automation
}

export default async function AutomationReportPage({ params }: AutomationReportPageProps) {
  const automation = await getReportData(params.id)

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading report...</div>}>
      <AutomationReport automation={automation} />
    </Suspense>
  )
}
