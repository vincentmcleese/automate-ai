'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle,
  Star,
  AlertTriangle,
  Copy,
  Download,
  Zap,
  Target,
  Wrench,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { AnimatedLoading } from './generate/AnimatedLoading'

interface SetupStep {
  step: number
  name: string
  node_type: string
  function: string
  setup: string[]
}

interface SetupGuideData {
  'setup time': string
  difficulty: 'easy' | 'medium' | 'hard'
  benefits: string[]
  requirements: string[]
  steps: SetupStep[]
}

interface SetupGuideProps {
  automationGuide: string | null
  automationId: string
}

const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
  hard: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
}

export function SetupGuide({ automationGuide, automationId }: SetupGuideProps) {
  if (!automationGuide) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-6 text-center text-gray-600">
          <AnimatedLoading text="Generating automation..." />
        </CardContent>
      </Card>
    )
  }

  let guideData: SetupGuideData
  try {
    guideData = JSON.parse(automationGuide)
  } catch (error) {
    console.error('Failed to parse automation guide:', error)
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-600" />
          <p className="text-red-800">Failed to load setup guide</p>
        </CardContent>
      </Card>
    )
  }

  const copyGuide = async () => {
    try {
      await navigator.clipboard.writeText(automationGuide)
      toast.success('Setup guide copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadGuide = () => {
    try {
      const blob = new Blob([automationGuide], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `setup-guide-${automationId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Setup guide downloaded!')
    } catch (error) {
      console.error('Failed to download:', error)
      toast.error('Failed to download guide')
    }
  }

  const difficulty = guideData.difficulty || 'medium'
  const difficultyStyle = difficultyConfig[difficulty]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-[#32da94] bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#32da94]">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">How to Set It Up</CardTitle>
                  <p className="mt-1 text-sm text-gray-600">Step-by-step implementation guide</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={copyGuide}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadGuide}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-[#32da94]" />
                <div>
                  <p className="font-medium text-gray-900">Setup Time</p>
                  <p className="text-sm text-gray-600">{guideData['setup time']}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-[#32da94]" />
                <div>
                  <p className="font-medium text-gray-900">Difficulty</p>
                  <Badge className={difficultyStyle.color}>
                    {difficultyStyle.icon}{' '}
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-[#32da94]" />
                <div>
                  <p className="font-medium text-gray-900">Total Steps</p>
                  <p className="text-sm text-gray-600">{guideData.steps?.length || 0} steps</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Benefits Section */}
      {guideData.benefits && guideData.benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {guideData.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className="flex items-start space-x-2 rounded-lg border border-green-100 bg-green-50 p-3"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <p className="text-sm text-green-800">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Requirements Section */}
      {guideData.requirements && guideData.requirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guideData.requirements.map((requirement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    className="flex items-start space-x-2 rounded-lg border border-orange-100 bg-orange-50 p-3"
                  >
                    <Wrench className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                    <p className="text-sm text-orange-800">{requirement}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Steps Section */}
      {guideData.steps && guideData.steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <ArrowRight className="h-5 w-5 text-[#32da94]" />
                <span>Implementation Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guideData.steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div className="flex space-x-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#32da94]">
                        <span className="text-sm font-bold text-white">{step.step}</span>
                      </div>
                      {index < guideData.steps.length - 1 && (
                        <div className="mt-2 ml-4 h-8 w-0.5 bg-gray-200"></div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-6">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{step.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {step.node_type}
                          </Badge>
                        </div>

                        <p className="mb-3 text-sm text-gray-600">{step.function}</p>

                        {step.setup && step.setup.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium tracking-wide text-gray-700 uppercase">
                              Setup Instructions:
                            </p>
                            <ul className="space-y-1">
                              {step.setup.map((instruction, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm">
                                  <span className="mt-1 text-[#32da94]">•</span>
                                  <span className="text-gray-700">{instruction}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
