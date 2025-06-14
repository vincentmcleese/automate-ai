import { WorkflowBuilder } from '@/components/landing/WorkflowBuilder'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AutomateAI - Create AI-Powered Automations Instantly',
  description:
    'Transform your ideas into powerful automations with AI. Connect your favorite tools, automate workflows, and boost productivity in minutes.',
  keywords: ['automation', 'AI', 'workflow', 'productivity', 'n8n', 'zapier alternative'],
  openGraph: {
    title: 'AutomateAI - Create AI-Powered Automations Instantly',
    description:
      'Transform your ideas into powerful automations with AI. Connect your favorite tools, automate workflows, and boost productivity in minutes.',
    type: 'website',
    url: 'https://www.automateai.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutomateAI - Create AI-Powered Automations Instantly',
    description:
      'Transform your ideas into powerful automations with AI. Connect your favorite tools, automate workflows, and boost productivity in minutes.',
  },
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="animate-background-glow bg-background absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(50,218,148,0.15),transparent_70%)]"></div>
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-16">
        <WorkflowBuilder />
      </main>
    </div>
  )
}
