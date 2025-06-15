#!/usr/bin/env tsx

/**
 * Script to test slug generation and verify database state
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSlugs() {
  console.log('🔍 Testing slug generation and database state...')

  try {
    // Check a few sample automations with their slugs
    const { data: automations, error } = await supabase
      .from('automations')
      .select('id, title, slug')
      .not('slug', 'is', null)
      .limit(5)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!automations || automations.length === 0) {
      console.log('❌ No automations with slugs found')
      return
    }

    console.log('✅ Sample automations with slugs:')
    automations.forEach((automation, index) => {
      console.log(`${index + 1}. "${automation.title}"`)
      console.log(`   Slug: ${automation.slug}`)
      console.log(`   ID: ${automation.id}`)
      console.log('')
    })

    // Check for uniqueness - count total vs unique slugs
    const { data: slugCount, error: countError } = await supabase
      .from('automations')
      .select('slug')
      .not('slug', 'is', null)

    if (countError) {
      throw countError
    }

    const totalSlugs = slugCount?.length || 0
    const uniqueSlugs = new Set(slugCount?.map(item => item.slug)).size

    console.log('📊 Slug Statistics:')
    console.log(`Total automations with slugs: ${totalSlugs}`)
    console.log(`Unique slugs: ${uniqueSlugs}`)
    console.log(`Duplicates: ${totalSlugs - uniqueSlugs}`)

    if (totalSlugs === uniqueSlugs) {
      console.log('✅ All slugs are unique!')
    } else {
      console.log('⚠️  Found duplicate slugs - this should not happen')
    }
  } catch (error) {
    console.error('❌ Error testing slugs:', error)
  }
}

testSlugs()
  .then(() => {
    console.log('🎉 Slug testing completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
