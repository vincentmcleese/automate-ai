#!/usr/bin/env tsx

/**
 * Script to populate missing slugs for existing automations
 * Run with: npm run populate-slugs
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { generateSlug } from '../src/lib/utils/slugify'

// Load environment variables
config({ path: '.env.local' })

// Initialize Supabase client with service role key (fallback to anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  console.error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('Missing required environment variables:')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabaseKey = supabaseServiceKey || supabaseAnonKey
const supabase = createClient(supabaseUrl, supabaseKey!)

if (!supabaseServiceKey) {
  console.log('⚠️  Using anon key - script may have limited permissions')
}

async function populateSlugsMissingAutomations() {
  console.log('🚀 Starting slug population for automations...')

  try {
    // Fetch all automations that don't have slugs but have titles
    const { data: automations, error: fetchError } = await supabase
      .from('automations')
      .select('id, title, slug')
      .not('title', 'is', null)
      .or('slug.is.null,slug.eq.')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch automations: ${fetchError.message}`)
    }

    if (!automations || automations.length === 0) {
      console.log('✅ No automations found that need slug generation.')
      return
    }

    console.log(`📋 Found ${automations.length} automations without slugs`)

    let successCount = 0
    let errorCount = 0

    // Process each automation
    for (const automation of automations) {
      try {
        console.log(`🔄 Processing: "${automation.title}" (${automation.id})`)

        // Generate slug from title
        const slug = generateSlug(automation.title)

        // Update the automation with the new slug
        const { error: updateError } = await supabase
          .from('automations')
          .update({ slug })
          .eq('id', automation.id)

        if (updateError) {
          // Handle potential slug conflicts
          if (updateError.code === '23505') {
            // unique constraint violation
            console.log(`⚠️  Slug conflict for "${automation.title}", generating new one...`)

            // Generate a new slug with fresh nanoid
            const newSlug = generateSlug(automation.title)
            const { error: retryError } = await supabase
              .from('automations')
              .update({ slug: newSlug })
              .eq('id', automation.id)

            if (retryError) {
              throw retryError
            }
            console.log(`✅ Updated with slug: ${newSlug}`)
          } else {
            throw updateError
          }
        } else {
          console.log(`✅ Updated with slug: ${slug}`)
        }

        successCount++
      } catch (error) {
        console.error(`❌ Error processing automation ${automation.id}:`, error)
        errorCount++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total processed: ${automations.length}`)
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  populateSlugsMissingAutomations()
    .then(() => {
      console.log('🎉 Slug population completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

export { populateSlugsMissingAutomations }
