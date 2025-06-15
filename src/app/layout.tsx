import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'AutomateAI - Intelligent Automation Platform',
  description: 'Streamline your workflow with AI-powered automation tools',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
