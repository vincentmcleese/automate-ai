'use client'

import { Button } from '@/components/ui/button'

export default function TestPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-bold">Button Component Tests</h1>
      <div className="flex items-center space-x-4">
        <Button>This should have the primary color</Button>
        <Button variant="secondary">Secondary button</Button>
        <Button variant="destructive">Destructive button</Button>
        <Button className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90">
          Brand Primary Button
        </Button>
      </div>
    </div>
  )
}
