#!/usr/bin/env node
/**
 * Migration runner — applies SQL files to the remote Supabase project
 * via the Supabase Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/migrate.js
 *
 * Get your personal access token at:
 *   https://supabase.com/dashboard/account/tokens
 */
const fs   = require('fs')
const path = require('path')

const PROJECT_REF = 'rtnplxrijzcueonahvxx'
const TOKEN       = process.env.SUPABASE_ACCESS_TOKEN

if (!TOKEN) {
  console.error('❌  Set SUPABASE_ACCESS_TOKEN env var first.')
  console.error('   Generate one at https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && f >= '005')   // only run new migrations
  .sort()

;(async () => {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    process.stdout.write(`▸ Running ${file} … `)
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      console.error(`\n❌  Failed: ${err}`)
      process.exit(1)
    }
    console.log('✅')
  }
  console.log('\n🎉  All migrations applied.')
})()
