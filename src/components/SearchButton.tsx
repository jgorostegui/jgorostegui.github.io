import { Search } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type SearchButtonProps = {
  className?: string
}

const SearchDialog = lazy(() => import('@/components/SearchDialog'))

/**
 * Header search trigger.
 *
 * Mounts the Cmd+K / Ctrl+K global keybind and owns the dialog open state.
 * The button itself is a ghost icon button sized to match ThemeToggle so
 * the header stays visually balanced.
 */
export default function SearchButton({ className }: SearchButtonProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search (Cmd+K)"
        className={cn(
          'text-foreground/70 hover:text-foreground',
          'inline-flex size-8 items-center justify-center rounded-md',
          'transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          className,
        )}
      >
        <Search className="size-4" />
      </button>
      {open && (
        <Suspense
          fallback={<SearchDialogFallback onClose={() => setOpen(false)} />}
        >
          <SearchDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  )
}

function SearchDialogFallback({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 z-50 cursor-default bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-loading-title"
        className={cn(
          'bg-background text-foreground fixed top-[20%] left-1/2 z-50',
          'w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2',
          'rounded-lg border px-4 py-3 shadow-xl',
        )}
      >
        <div className="flex items-center gap-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <p
            id="search-loading-title"
            className="text-muted-foreground text-sm"
          >
            Loading search...
          </p>
        </div>
      </div>
    </>
  )
}
