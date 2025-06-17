import posthog from 'posthog-js'

// Utility functions for PostHog tracking
export const analytics = {
  // Track custom events
  track: (eventName: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties)
    }
  },

  // Identify users (call after authentication)
  identify: (userId: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties)
    }
  },

  // Reset user identity (call on logout)
  reset: () => {
    if (typeof window !== 'undefined') {
      posthog.reset()
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      posthog.setPersonProperties(properties)
    }
  },

  // Start/stop session recording
  startRecording: () => {
    if (typeof window !== 'undefined') {
      posthog.startSessionRecording()
    }
  },

  stopRecording: () => {
    if (typeof window !== 'undefined') {
      posthog.stopSessionRecording()
    }
  },

  // Feature flags
  isFeatureEnabled: (flagKey: string): boolean => {
    if (typeof window !== 'undefined') {
      return posthog.isFeatureEnabled(flagKey) ?? false
    }
    return false
  },
}

// Export the usePostHog hook for React components
export { usePostHog } from 'posthog-js/react'

// Event names for consistency
export const EVENTS = {
  // User actions
  AUTOMATION_CREATED: 'automation_created',
  AUTOMATION_DOWNLOADED: 'automation_downloaded',
  AUTOMATION_SHARED: 'automation_shared',
  PROMPT_SUBMITTED: 'prompt_submitted',
  INSPIRE_ME_CLICKED: 'inspire_me_clicked',

  // Navigation
  PAGE_VIEW: '$pageview',
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',

  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Workflow
  WORKFLOW_VALIDATED: 'workflow_validated',
  WORKFLOW_GENERATION_STARTED: 'workflow_generation_started',
  WORKFLOW_GENERATION_COMPLETED: 'workflow_generation_completed',
  WORKFLOW_GENERATION_FAILED: 'workflow_generation_failed',
} as const

export default posthog
