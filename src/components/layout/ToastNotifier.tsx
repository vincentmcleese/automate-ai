'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ToastNotifier() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('signed_in') === 'true') {
      toast.success('Signed in successfully')

      // Create a new URLSearchParams object without the 'signed_in' param
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('signed_in')

      // Replace the current history entry
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  return null
}
