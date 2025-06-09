import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AutomationNotFound() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/automations" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Automations</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#000000]">Automation Not Found</h1>
              <p className="text-[#6b7280]">The requested automation could not be found</p>
            </div>
          </div>

          {/* Not Found Card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span>Automation Not Found</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-orange-700">
                The automation you&apos;re looking for doesn&apos;t exist or may have been deleted.
              </p>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button asChild className="bg-[#32da94] text-white hover:bg-[#2bc780]">
                  <Link href="/automations">View All Automations</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Create New Automation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
