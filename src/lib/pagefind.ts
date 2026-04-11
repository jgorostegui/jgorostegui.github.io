/**
 * Pagefind loader + type definitions.
 *
 * Pagefind ships its index as `/pagefind/pagefind.js` during the postbuild
 * step (`pagefind --site dist`). It does not bundle types, so this module
 * declares just enough of the API surface to stay type-safe.
 *
 * The `/pagefind/pagefind.js` file does not exist in dev mode or in builds
 * where `ENABLE_SEARCH=false`. Callers must handle load failures - use
 * `loadPagefind()` in a try/catch and surface a helpful fallback.
 */

export type PagefindSubResult = {
  title: string
  url: string
  excerpt: string
}

export type PagefindResultMeta = {
  title?: string
  image?: string
  image_alt?: string
  [key: string]: string | undefined
}

export type PagefindResultData = {
  url: string
  raw_url: string
  excerpt: string
  meta: PagefindResultMeta
  sub_results?: PagefindSubResult[]
  word_count?: number
}

export type PagefindResult = {
  id: string
  score: number
  words: number[]
  data: () => Promise<PagefindResultData>
}

export type PagefindSearchResponse = {
  results: PagefindResult[]
}

export type PagefindAPI = {
  search: (query: string) => Promise<PagefindSearchResponse>
  init?: () => Promise<void>
  options?: (opts: Record<string, unknown>) => Promise<void>
}

let cached: PagefindAPI | null = null
let inFlight: Promise<PagefindAPI> | null = null

/**
 * Lazy-load the Pagefind runtime. Caches the instance, so repeated calls
 * share the same module. The dynamic import path is a runtime string so
 * Vite does not try to resolve it at build time - Pagefind's assets are
 * generated *after* `astro build`, well outside the Vite graph.
 */
export async function loadPagefind(): Promise<PagefindAPI> {
  if (cached) return cached
  if (inFlight) return inFlight

  inFlight = (async () => {
    const path = '/pagefind/pagefind.js'
    const mod = (await import(/* @vite-ignore */ path)) as PagefindAPI
    await mod.options?.({ baseUrl: '/', excerptLength: 30 })
    await mod.init?.()
    cached = mod
    return mod
  })()

  return inFlight
}

/**
 * Resolve the top `limit` raw Pagefind results to their full data objects.
 * Pagefind returns result records with an async `data()` fetcher to keep
 * initial searches cheap; this helper awaits all of them in parallel.
 */
export async function resolveResults(
  response: PagefindSearchResponse,
  limit: number,
): Promise<PagefindResultData[]> {
  const top = response.results.slice(0, limit)
  return Promise.all(top.map((r) => r.data()))
}
