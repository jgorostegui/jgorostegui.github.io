import { FileText, Search } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'

import {
  loadPagefind,
  resolveResults,
  type PagefindAPI,
  type PagefindResultData,
} from '@/lib/pagefind'
import { cn } from '@/lib/utils'

type SearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_RESULTS = 8
const DEBOUNCE_MS = 120

/**
 * Controlled Radix Dialog that wraps a Pagefind-powered search UI.
 *
 * Load strategy: Pagefind is a ~40KB WASM module. We hold off loading it
 * until the dialog first opens, so users who never invoke search never
 * pay that cost. The loaded instance is cached in the `pagefind.ts`
 * module so re-opens are free.
 *
 * Failure mode: dev mode and `ENABLE_SEARCH=false` builds don't emit
 * `/pagefind/pagefind.js`. The component catches the 404 and shows a
 * helpful message instead of crashing.
 */
export default function SearchDialog({
  open,
  onOpenChange,
}: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResultData[]>([])
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'searching' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const pagefindRef = useRef<PagefindAPI | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Lazy-load Pagefind the first time the dialog opens.
  useEffect(() => {
    if (!open || pagefindRef.current) return
    setStatus('loading')
    loadPagefind()
      .then((mod) => {
        pagefindRef.current = mod
        setStatus('idle')
      })
      .catch((err) => {
        console.warn('[search] Pagefind failed to load', err)
        setStatus('error')
        setErrorMsg(
          'Search index not found. The index is generated at build time - try a production build.',
        )
      })
  }, [open])

  // Reset transient state when the dialog closes so the next open is fresh.
  useEffect(() => {
    if (open) return
    setQuery('')
    setResults([])
    if (status !== 'error') setStatus('idle')
  }, [open])

  // Debounced search. Cancels stale in-flight requests via a `cancelled` flag
  // so out-of-order responses can't overwrite a newer query's results.
  useEffect(() => {
    const pf = pagefindRef.current
    if (!pf) return
    if (!query.trim()) {
      setResults([])
      return
    }

    let cancelled = false
    setStatus('searching')
    const handle = window.setTimeout(async () => {
      try {
        const response = await pf.search(query)
        const resolved = await resolveResults(response, MAX_RESULTS)
        if (cancelled) return
        setResults(resolved)
        setStatus('idle')
      } catch (err) {
        if (cancelled) return
        console.warn('[search] query failed', err)
        setStatus('error')
        setErrorMsg('Search failed. Try again in a moment.')
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [query])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
          )}
        />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className={cn(
            'bg-background text-foreground fixed top-[20%] left-1/2 z-50',
            '-translate-x-1/2 w-[min(32rem,calc(100vw-2rem))]',
            'rounded-lg border shadow-xl',
          )}
        >
          <Dialog.Title className="sr-only">Search the blog</Dialog.Title>
          <Dialog.Description className="sr-only">
            Full-text search of blog posts. Press Escape to close.
          </Dialog.Description>

          <div className="border-border flex items-center gap-3 border-b px-4 py-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts..."
              className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
              aria-label="Search query"
            />
            <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              Esc
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            <SearchResultsList
              status={status}
              query={query}
              results={results}
              errorMsg={errorMsg}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type SearchResultsListProps = {
  status: 'idle' | 'loading' | 'searching' | 'error'
  query: string
  results: PagefindResultData[]
  errorMsg: string
}

function SearchResultsList({
  status,
  query,
  results,
  errorMsg,
}: SearchResultsListProps) {
  if (status === 'error') {
    return (
      <p className="text-muted-foreground px-3 py-4 text-sm">{errorMsg}</p>
    )
  }

  if (status === 'loading') {
    return (
      <p className="text-muted-foreground px-3 py-4 text-sm">
        Loading search index...
      </p>
    )
  }

  if (!query.trim()) {
    return (
      <p className="text-muted-foreground px-3 py-4 text-sm">
        Type to search blog posts.
      </p>
    )
  }

  if (status === 'idle' && results.length === 0) {
    return (
      <p className="text-muted-foreground px-3 py-4 text-sm">
        No results for "{query}".
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {results.map((r) => (
        <li key={r.url}>
          <a
            href={r.url}
            className={cn(
              'hover:bg-muted focus:bg-muted',
              'flex flex-col gap-1 rounded-md px-3 py-2',
              'outline-none transition-colors',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <FileText className="text-muted-foreground size-3.5 shrink-0" />
              {r.meta.title ?? r.url}
            </span>
            {r.excerpt && (
              <span
                className="text-muted-foreground line-clamp-2 text-xs"
                // Pagefind wraps matched terms in <mark>. We trust its output
                // because the content comes from our own indexed pages.
                dangerouslySetInnerHTML={{ __html: r.excerpt }}
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
