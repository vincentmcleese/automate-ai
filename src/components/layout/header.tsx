'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserMenu } from '@/components/auth/user-menu'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/greenghost.png"
              alt="Automate Logo"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="text-xl font-bold">
              Ghost{' '}
              <span className="from-primary bg-gradient-to-r to-teal-400 bg-clip-text text-transparent">
                Flows
              </span>
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/automations"
              className="hover:text-foreground/80 text-foreground/60 transition-colors"
            >
              Automations
            </Link>
            <Link
              href="/pricing"
              className="hover:text-foreground/80 text-foreground/60 transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other components can go here */}
          </div>
          <nav className="flex items-center">
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}
