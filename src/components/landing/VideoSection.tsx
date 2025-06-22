'use client'

import { useState, useRef } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleLoadedData = () => {
    setIsLoaded(true)
  }

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">See How It Works</h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Watch how easy it is to create powerful automations with AI in just minutes
        </p>
      </div>

      <div className="relative mx-auto max-w-4xl px-4">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            preload="metadata"
            poster="/video-poster.jpg"
            onLoadedData={handleLoadedData}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
          >
            <source src="/video/landingpagedemo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="border-brand-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
            </div>
          )}

          {/* Custom Play Button Overlay (optional, since we're using native controls) */}
          {!isPlaying && isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
              <Button
                onClick={togglePlay}
                size="lg"
                className="h-16 w-16 rounded-full bg-white/20 p-0 backdrop-blur-sm hover:bg-white/30"
              >
                <Play className="ml-1 h-6 w-6 text-white" fill="white" />
              </Button>
            </div>
          )}
        </div>

        {/* Video description */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            See how you can go from idea to working automation in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  )
}
