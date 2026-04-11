import { FileText, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  loadPagefind,
  resolveResults,
  type PagefindAPI,
  type PagefindResultData,
} from '@/lib/pagefind'
import { cn } from '@/lib/utils'

const MAX_RESULTS = 20

type Status = 'loading' | 'idle' | 'searching' | 'error'

/**
 * Standalone search results page island.
 *
 * Mounted by src/pages/search.astro. This is the crawlable URL that
 * `WebSite.SearchAction` in the JSON-LD schema points at, so the
 * component's contract is: if the user lands here with `?q=foo`, show
 * foo's results immediately; mirror the query back into the URL as the
 * user types so the state is bookmarkable and back-button-friendly.
 *
 * Shares no code with SearchDialog beyond the pagefind loader - the two
 * layouts (page vs modal) diverge enough that extracting a common hook
 * would trade real code for speculative reuse.
 */
export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResultData[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [pagefind, setPagefind] = useState<PagefindAPI | null>(null)

  // Initial mount: read ?q= and load pagefind.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get('q') ?? ''
    setQuery(initial)

    loadPagefind()
      .then((mod) => {
        setPagefind(mod)
        setStatus('idle')
      })
      .catch((err) => {
        console.warn('[search page] pagefind failed to load', err)
        setErrorMsg(
          'Search index not found. The index is generated at build time - try a production build with ENABLE_SEARCH=true.',
        )
        setStatus('error')
      })
  }, [])

  // Mirror query state into the URL so refresh/share/back button all work.
  useEffect(() => {
    if (status === 'loading' || status === 'error') return
    const url = new URL(window.location.href)
    if (query) {
      url.searchParams.set('q', query)
    } else {
      url.searchParams.delete('q')
    }
    window.history.replaceState({}, '', url.toString())
  }, [query, status])

  // Run search. Guard against stale responses when the user types fast.
  useEffect(() => {
    if (!pagefind || !query.trim()) {
      setResults([])
      return
    }

    let cancelled = false
    setStatus('searching')
    ;(async () => {
      try {
        const response = await pagefind.search(query)
        const resolved = await resolveResults(response, MAX_RESULTS)
        if (cancelled) return
        setResults(resolved)
        setStatus('idle')
      } catch (err) {
        if (cancelled) return
        console.warn('[search page] query failed', err)
        setErrorMsg('Search failed. Try again in a moment.')
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query, pagefind])

  return (
    <div className="flex flex-col gap-6">
      <label
        className={cn(
          'border-border bg-background flex items-center gap-3 rounded-md border px-4 py-3',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        )}
      >
        <Search className="text-muted-foreground size-4 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          aria-label="Search query"
          autoFocus
        />
      </label>

      <SearchPageResults
        status={status}
        query={query}
        results={results}
        errorMsg={errorMsg}
      />
    </div>
  )
}

type ResultsProps = {
  status: Status
  query: string
  results: PagefindResultData[]
  errorMsg: string
}

function SearchPageResults({ status, query, results, errorMsg }: ResultsProps) {
  if (status === 'loading') {
    return (
      <p className="text-muted-foreground text-sm">Loading search index...</p>
    )
  }

  if (status === 'error') {
    return <p className="text-muted-foreground text-sm">{errorMsg}</p>
  }

  if (!query.trim()) {
    return (
      <p className="text-muted-foreground text-sm">
        Type above to search blog posts.
      </p>
    )
  }

  if (status === 'idle' && results.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No results for "{query}".
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {results.map((r) => (
        <li key={r.url}>
          <a
            href={r.url}
            className={cn(
              'hover:bg-muted/50 block rounded-md border p-4',
              'transition-colors outline-none',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            )}
          >
            <span className="flex items-center gap-2 text-base font-medium">
              <FileText className="text-muted-foreground size-4 shrink-0" />
              {r.meta.title ?? r.url}
            </span>
            {r.excerpt && (
              <span
                className="text-muted-foreground mt-2 block text-sm"
                dangerouslySetInnerHTML={{ __html: r.excerpt }}
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
