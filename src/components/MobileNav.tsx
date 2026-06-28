import { Menu } from 'lucide-react'
import { useEffect, useRef, useState, type FocusEvent } from 'react'

import { cn } from '@/lib/utils'
import type { SocialLink } from '@/types'

type MobileNavProps = {
  links: SocialLink[]
  className?: string
}

/**
 * Mobile navigation island.
 *
 * Renders a hamburger-icon trigger that opens a compact link list at widths
 * below the `sm:` breakpoint.
 *
 * Hydration: the parent uses `client:media` so desktop viewports do not
 * hydrate this hidden mobile-only control.
 */
export default function MobileNav({ links, className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = (restoreFocus = false) => {
    setOpen(false)

    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close(true)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget as Node | null
    if (open && !event.currentTarget.contains(nextFocused)) {
      close()
    }
  }

  return (
    <div ref={rootRef} className="relative sm:hidden" onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'text-foreground/70 hover:text-foreground',
          'inline-flex size-8 items-center justify-center rounded-md',
          'transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          className,
        )}
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className={cn(
            'bg-background text-foreground absolute top-full right-0 z-50 mt-2 min-w-[9rem]',
            'overflow-hidden rounded-md border p-1 shadow-md',
          )}
        >
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => close()}
              className={cn(
                'hover:bg-muted focus:bg-muted focus:text-foreground',
                'block rounded-sm px-3 py-2 text-sm capitalize',
                'outline-none select-none',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
