import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import SearchDialog from '@/components/SearchDialog'
import { cn } from '@/lib/utils'

type SearchButtonProps = {
  className?: string
}

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
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
