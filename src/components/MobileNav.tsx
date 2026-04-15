import { Menu } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import { cn } from '@/lib/utils'
import type { SocialLink } from '@/types'

type MobileNavProps = {
  links: SocialLink[]
  className?: string
}

/**
 * Mobile navigation island.
 *
 * Renders a hamburger-icon trigger that opens a Radix DropdownMenu with
 * every site nav link. Intended to replace the inline desktop `<nav>` at
 * widths below the `sm:` breakpoint - the parent header is responsible
 * for hiding/showing this component vs the desktop nav via Tailwind
 * responsive classes.
 *
 * Hydration: `client:idle` is enough. Users on mobile are unlikely to
 * tap the menu within the first paint, so we let the main bundle settle
 * before initializing Radix.
 */
export default function MobileNav({ links, className }: MobileNavProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Open navigation menu"
        className={cn(
          'text-foreground/70 hover:text-foreground',
          'inline-flex size-8 items-center justify-center rounded-md',
          'transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          className,
        )}
      >
        <Menu className="size-4" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            'bg-background text-foreground z-50 min-w-[9rem]',
            'overflow-hidden rounded-md border p-1 shadow-md',
          )}
        >
          {links.map((item) => (
            <DropdownMenu.Item
              key={item.href}
              asChild
              className={cn(
                'focus:bg-muted focus:text-foreground',
                'cursor-pointer rounded-sm px-3 py-2 text-sm capitalize',
                'outline-none select-none',
              )}
            >
              <a href={item.href}>{item.label}</a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
