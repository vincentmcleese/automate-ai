import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/lib/auth/context'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/layout/header'
import { ToastNotifier } from '@/components/layout/ToastNotifier'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Suspense } from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const chunkoBold = localFont({
  src: '../assets/fonts/chunko-bold.ttf',
  variable: '--font-chunko-bold',
  weight: '700',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Launch GhostTeam - AI-Powered Workflow Automation',
  description:
    'Launch your GhostTeam and automate workflows with AI. Create intelligent automations that streamline your business processes.',
  metadataBase: new URL('https://launch.ghostteam.ai'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chunkoBold.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen">
              <Header />
              <ErrorBoundary>
                <main>{children}</main>
              </ErrorBoundary>
            </div>
            <Toaster />
            <Suspense>
              <ToastNotifier />
            </Suspense>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
