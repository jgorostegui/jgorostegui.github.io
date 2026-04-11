#!/usr/bin/env bun
export {}
/**
 * Conditional postbuild step.
 *
 * Runs after `astro build`. When ENABLE_SEARCH=true, invokes the pagefind
 * CLI to index the built `dist/` directory and emit the WASM search
 * runtime into `dist/pagefind/`. When the flag is off (or unset), logs
 * and exits cleanly so the build succeeds without a search index.
 *
 * This lives in a script file rather than an inline `&&`/`||` chain in
 * package.json because shell quoting inside JSON is unmaintainable, and
 * because an inline chain would mask pagefind failures as success.
 */

const enableSearch = process.env.ENABLE_SEARCH === 'true'

if (!enableSearch) {
  const value = process.env.ENABLE_SEARCH ?? 'unset'
  console.log(`[postbuild] search skipped (ENABLE_SEARCH=${value})`)
  process.exit(0)
}

console.log('[postbuild] running pagefind against dist/...')
const proc = Bun.spawn(['pagefind', '--site', 'dist'], {
  stdout: 'inherit',
  stderr: 'inherit',
})

const code = await proc.exited
if (code !== 0) {
  console.error(`[postbuild] pagefind exited with code ${code}`)
}
process.exit(code)
