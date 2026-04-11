export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  featuredPostCount: number
  postsPerPage: number
}

export type SocialLink = {
  href: string
  label: string
}

export type IconMap = {
  [key: string]: string
}

export type FeatureFlag = {
  enabled: boolean
}

export type Features = {
  // Build-time gated (env-var derived)
  search: FeatureFlag
  ogImages: FeatureFlag
  analytics: FeatureFlag
  // Pure runtime (UI toggles)
  mobileNav: FeatureFlag
  shareButtons: FeatureFlag
  editOnGithub: FeatureFlag
  relatedPosts: FeatureFlag
  readingProgress: FeatureFlag
  mediumZoom: FeatureFlag
  featuredPosts: FeatureFlag
}
