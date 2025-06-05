'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Zap, ArrowRight } from 'lucide-react'

export default function Home() {
  const [workflow, setWorkflow] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAutomate = async () => {
    if (!workflow.trim()) return
    
    setIsLoading(true)
    // TODO: Implement workflow automation logic
    console.log('Automating workflow:', workflow)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-[#32da94]" />
            <h1 className="text-4xl md:text-6xl font-bold text-[#000000]">
              AutomateAI
            </h1>
            <Zap className="h-8 w-8 text-[#32da94]" />
          </div>
          
          <p className="text-xl md:text-2xl text-[#6b7280] max-w-3xl mx-auto leading-relaxed">
            Describe your workflow in plain English, and watch as AI transforms it into powerful automation
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="border border-[#e5e7eb] shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-6">
              <div className="text-left">
                <label 
                  htmlFor="workflow-input" 
                  className="block text-lg font-semibold text-[#000000] mb-3"
                >
                  What would you like to automate?
                </label>
                <p className="text-sm text-[#6b7280] mb-4">
                  Examples: &ldquo;Send weekly reports to my team&rdquo;, &ldquo;Organize my emails by priority&rdquo;, &ldquo;Schedule social media posts&rdquo;
                </p>
              </div>
              
              <div className="relative">
                <Textarea
                  id="workflow-input"
                  placeholder="Describe your workflow automation idea here... Be as detailed as you'd like!"
                  value={workflow}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkflow(e.target.value)}
                  className="min-h-[120px] text-base border-2 border-[#e5e7eb] focus:border-[#32da94] focus:ring-[#32da94] focus:ring-2 focus:ring-opacity-20 resize-none transition-colors duration-200"
                  disabled={isLoading}
                />
                
                {/* Character count */}
                <div className="absolute bottom-3 right-3 text-xs text-[#6b7280]">
                  {workflow.length} characters
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Button
                  onClick={handleAutomate}
                  disabled={!workflow.trim() || isLoading}
                  className="w-full sm:w-auto bg-[#32da94] hover:bg-[#2bb885] text-white font-semibold px-8 py-3 text-lg rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Automate
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {workflow.trim() && !isLoading && (
                  <Button
                    variant="outline"
                    onClick={() => setWorkflow('')}
                    className="w-full sm:w-auto border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8f9fa]"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="border border-[#e5e7eb] hover:border-[#32da94] transition-colors duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#32da94] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="font-semibold text-[#000000] mb-2">AI-Powered</h3>
              <p className="text-sm text-[#6b7280]">
                Advanced AI understands your workflow descriptions and creates intelligent automations
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-[#e5e7eb] hover:border-[#32da94] transition-colors duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#32da94] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="font-semibold text-[#000000] mb-2">Instant Setup</h3>
              <p className="text-sm text-[#6b7280]">
                No coding required. Just describe what you want and we&apos;ll handle the technical details
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-[#e5e7eb] hover:border-[#32da94] transition-colors duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#32da94] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-[#32da94]" />
              </div>
              <h3 className="font-semibold text-[#000000] mb-2">Easy Integration</h3>
              <p className="text-sm text-[#6b7280]">
                Seamlessly connects with your existing tools and workflows
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
