'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserMenu } from '@/components/auth/user-menu'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/greenghost.png"
            alt="Automate Logo"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="font-chunko text-xl tracking-wider">
            <span className="from-primary bg-gradient-to-r to-teal-400 bg-clip-text text-transparent">
              GHOST
            </span>
            TEAM
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-8 hidden items-center space-x-6 text-sm font-medium md:flex">
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

        {/* Right side - UserMenu and Mobile Menu Button */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:block">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="bg-background/95 border-t backdrop-blur md:hidden">
          <nav className="container mx-auto flex flex-col space-y-4 px-4 py-4">
            <Link
              href="/automations"
              className="hover:text-foreground/80 text-foreground/60 text-base font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Automations
            </Link>
            <Link
              href="/pricing"
              className="hover:text-foreground/80 text-foreground/60 text-base font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="border-t pt-2">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
