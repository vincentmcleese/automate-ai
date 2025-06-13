'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ContinuePage() {
  const router = useRouter()

  useEffect(() => {
    const journeyData = localStorage.getItem('automation_journey')
    if (journeyData) {
      try {
        const { userInput, selectedTools, action } = JSON.parse(journeyData)
        localStorage.removeItem('automation_journey')

        if (action === 'create' && userInput && selectedTools) {
          const params = new URLSearchParams()
          params.set('userInput', userInput)
          params.set('selectedTools', JSON.stringify(selectedTools))
          params.set('action', 'create')

          router.replace(`/?${params.toString()}`)
        } else {
          // If data is invalid, just go to dashboard
          router.replace('/dashboard')
        }
      } catch (error) {
        // If parsing fails, just go to dashboard
        console.error('Failed to parse automation journey', error)
        localStorage.removeItem('automation_journey')
        router.replace('/dashboard')
      }
    } else {
      // If no journey data, nothing to do, go to dashboard
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-muted-foreground">Continuing your journey...</p>
      </div>
    </div>
  )
}
