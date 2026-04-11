import type { Features, IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Josu Gorostegui',
  description: 'Software engineer. Generalist. Machine learning.',
  href: 'https://jgorostegui.github.io',
  author: 'Josu Gorostegui',
  locale: 'en-US',
  featuredPostCount: 3,
  postsPerPage: 6,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'blog',
  },
  {
    href: '/about',
    label: 'about',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/jgorostegui',
    label: 'GitHub',
  },
  {
    href: 'https://twitter.com/josu_goros',
    label: 'Twitter',
  },
  {
    href: 'https://linkedin.com/in/josugorostegui',
    label: 'LinkedIn',
  },
  {
    href: 'https://jgorostegui.medium.com',
    label: 'Medium',
  },
  {
    href: 'https://jgorostegui.substack.com',
    label: 'Substack',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Medium: 'lucide:pen-line',
  Substack: 'lucide:mail',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

/**
 * Feature flags.
 *
 * Two categories:
 *
 * 1. Build-time gated - derived from env vars. The same env var that gates
 *    the build step (Pagefind indexing, OG endpoint, analytics injection)
 *    also determines whether the runtime UI shows. This keeps UI and
 *    build-output state coherent: no search button when there's no index.
 *
 * 2. Pure runtime - hardcoded here. Toggles UI visibility only. Flip to
 *    enable/disable without rebuilding anything upstream. P2 features
 *    default to false until their implementation lands.
 */
export const FEATURES: Features = {
  // Build-time gated
  search: {
    enabled: import.meta.env.ENABLE_SEARCH === 'true',
  },
  ogImages: {
    enabled: import.meta.env.ENABLE_OG_IMAGES === 'true',
  },
  analytics: {
    enabled: Boolean(import.meta.env.PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN),
  },

  // Pure runtime
  mobileNav: { enabled: true },
  shareButtons: { enabled: false },
  editOnGithub: { enabled: false },
  relatedPosts: { enabled: false },
  readingProgress: { enabled: false },
  mediumZoom: { enabled: false },
  featuredPosts: { enabled: false },
}
