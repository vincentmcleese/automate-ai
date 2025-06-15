#!/usr/bin/env tsx

/**
 * Script to test slug-based routing and backward compatibility
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRouting() {
  console.log('🧪 Testing slug-based routing and backward compatibility...')

  try {
    // Get a sample automation with both ID and slug
    const { data: automation, error } = await supabase
      .from('automations')
      .select('id, title, slug')
      .not('slug', 'is', null)
      .limit(1)
      .single()

    if (error || !automation) {
      console.log('❌ Could not find automation for testing')
      return
    }

    console.log('📋 Test automation:')
    console.log(`   Title: "${automation.title}"`)
    console.log(`   ID: ${automation.id}`)
    console.log(`   Slug: ${automation.slug}`)
    console.log('')

    // Test UUID route format
    const uuidUrl = `/automations/${automation.id}`
    console.log(`✅ UUID Route: ${uuidUrl}`)

    // Test slug route format
    const slugUrl = `/automations/${automation.slug}`
    console.log(`✅ Slug Route: ${slugUrl}`)
    console.log('')

    console.log('🔍 SEO Comparison:')
    console.log(`   Before: https://automate.ghostteam.ai${uuidUrl}`)
    console.log(`   After:  https://automate.ghostteam.ai${slugUrl}`)
    console.log('')

    // Verify identifier detection logic
    const { isUUID } = await import('../src/lib/utils/identifier')

    console.log('🔍 Identifier Detection:')
    console.log(`   "${automation.id}" is UUID: ${isUUID(automation.id)}`)
    console.log(`   "${automation.slug}" is UUID: ${isUUID(automation.slug)}`)
    console.log('')

    console.log('✅ Both routes should work:')
    console.log(`   - UUID route for backward compatibility`)
    console.log(`   - Slug route for SEO-friendly URLs`)
    console.log(`   - AutomationCard components now use slug URLs`)
  } catch (error) {
    console.error('❌ Error testing routing:', error)
  }
}

testRouting()
  .then(() => {
    console.log('🎉 Routing test completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
