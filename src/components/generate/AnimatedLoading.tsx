'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
    },
  },
}

export function AnimatedLoading({ text }: { text: string }) {
  return (
    <div className="border-border bg-card flex flex-col items-center justify-center space-y-6 rounded-lg border p-8">
      <motion.div
        animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Zap className="text-brand-primary h-12 w-12" />
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-text-secondary flex items-center justify-center space-x-1.5 text-lg font-medium"
      >
        {text.split('').map((char, index) => (
          <motion.span key={index} variants={itemVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
