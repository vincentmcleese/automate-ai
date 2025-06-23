import React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const CallToActionButton = () => (
  <div className="group relative">
    <Button
      className="flex items-center bg-black px-4 text-white shadow-md hover:bg-gray-800"
      asChild
    >
      <Link
        href="https://www.ghostteam.ai/begin?utm_source=launch"
        className="flex w-full items-center justify-between gap-3"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <Image
            src="/images/ghost_whitest_transparent.png"
            alt="Ghost Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <span className="flex-grow text-center font-medium">Book a Call</span>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-white">
          <ArrowUpRight
            className="text-primary h-5 w-5 transition-transform duration-150 ease-in-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2.5}
          />
        </div>
      </Link>
    </Button>
    <div className="absolute top-full left-0 z-10 mt-2 flex max-w-xs scale-0 transform items-center gap-2 rounded-lg bg-white p-3 text-sm text-gray-600 shadow-lg transition-transform duration-200 group-hover:scale-100">
      <Image
        src="/images/elliot.jpg"
        alt="Elliot - AI Growth Designer"
        width={32}
        height={32}
        className="flex-shrink-0 rounded-full"
      />
      <span>Free 30 minute chat with Elliot, AI growth designer.</span>
    </div>
  </div>
)

export default CallToActionButton
