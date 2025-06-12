'use client'

import { useEffect, useState } from 'react'

interface FormattedDateProps {
  dateString: string
}

export function FormattedDate({ dateString }: FormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    // This code runs only on the client, after hydration
    setFormattedDate(new Date(dateString).toLocaleDateString())
  }, [dateString])

  // Render a placeholder or nothing on the server and initial client render
  if (!formattedDate) {
    return null
  }

  return <>{formattedDate}</>
}
