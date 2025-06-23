'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserMenu } from '@/components/auth/user-menu'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CallToActionButton from '@/components/ui/CallToActionButton'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2"
          onClick={() => (window.location.href = '/')}
        >
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

        {/* Desktop Navigation - Centered */}
        <div className="hidden flex-1 justify-center md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/#how-it-works"
              className="hover:text-foreground/80 text-foreground/60 transition-colors"
            >
              How it works
            </Link>
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
            <a
              href="https://discord.gg/pfKVnH3P"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 text-foreground/60 inline-flex items-center transition-colors"
            >
              <svg
                className="mr-1.5 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
            </a>
          </nav>
        </div>

        {/* Right side - CTA, UserMenu and Mobile Menu Button */}
        <div className="flex items-center justify-end space-x-3">
          <div className="hidden md:block">
            <CallToActionButton />
          </div>
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
              href="/#how-it-works"
              className="hover:text-foreground/80 text-foreground/60 text-base font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </Link>
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
            <a
              href="https://discord.gg/pfKVnH3P"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 text-foreground/60 inline-flex items-center text-base font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
            </a>
            <div className="space-y-3 border-t pt-4">
              <CallToActionButton />
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
