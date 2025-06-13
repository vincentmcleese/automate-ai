'use client'

import { motion } from 'framer-motion'
import { PenSquare, BrainCircuit, FileJson, ChevronRight } from 'lucide-react'

const steps = [
  {
    icon: <PenSquare className="h-6 w-6" />,
    text: 'Describe your workflow',
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    text: 'Our AI analyzes it',
  },
  {
    icon: <FileJson className="h-6 w-6" />,
    text: 'Production-ready JSON & guide',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.5,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
    },
  },
}

export function ProcessSteps() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-muted-foreground flex flex-col items-center justify-center gap-4 text-sm sm:flex-row sm:gap-6"
    >
      {steps.map((step, index) => (
        <motion.div key={index} className="flex items-center gap-6" variants={itemVariants}>
          <div className="flex items-center gap-2">
            {step.icon}
            <span>{step.text}</span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="text-primary hidden h-6 w-6 sm:block" />
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
