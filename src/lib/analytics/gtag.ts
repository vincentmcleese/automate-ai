// Google Analytics utility functions for Next.js
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

// Types for Google Analytics events
type GAEventAction =
  | 'automation_created'
  | 'automation_downloaded'
  | 'automation_shared'
  | 'prompt_submitted'
  | 'inspire_me_clicked'
  | 'user_signed_up'
  | 'user_signed_in'
  | 'discord_clicked'
  | 'page_view'

interface GAEventParams {
  event_category?: string
  event_label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

// Track custom events
export const trackEvent = (action: GAEventAction, parameters?: GAEventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: parameters?.event_category || 'engagement',
      event_label: parameters?.event_label,
      value: parameters?.value,
      ...parameters?.custom_parameters,
    })
  }
}

// Track page views (handled automatically by @next/third-parties, but available for manual tracking)
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_location: url,
      page_title: title,
    })
  }
}

// Track conversions/goals
export const trackConversion = (conversionId: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
    })
  }
}

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      custom_map: properties,
    })
  }
}

// Consent management for GDPR compliance
export const grantConsent = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
    })
  }
}

export const denyConsent = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    })
  }
}
