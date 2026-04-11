/**
 * JSON-LD schema builders.
 *
 * Each function returns a plain object that can be JSON.stringify'd into
 * a <script type="application/ld+json"> tag. The types stop short of
 * modeling the entire schema.org vocabulary - they cover exactly the
 * properties we emit, no more.
 *
 * Design notes:
 *
 * - All URLs are absolute. Google's validators reject relative URLs in
 *   structured data, so every builder takes `Astro.site` (or derives it
 *   via `new URL(path, site)`) and resolves against it.
 *
 * - Person schema lives on the about page only. It's valid on every
 *   page but shipping it everywhere is noise - Google's "main entity"
 *   hint is to emit Person on the page that most clearly represents
 *   the person.
 *
 * - WebSite schema ships on every page. `SearchAction` is most useful
 *   on the homepage but valid site-wide. The target URL template points
 *   at /search?q={search_term_string} - that page is crawlable (it's a
 *   real route, not a modal), so the schema is not lying.
 *
 * - BlogPosting uses `headline` (required) and `articleBody` is not
 *   included - Google reads the visible article, we don't need to
 *   duplicate the entire post into the JSON-LD.
 */

import { SITE, SOCIAL_LINKS } from '@/consts'

type JsonLd = Record<string, unknown>

export function personSchema(siteUrl: URL): JsonLd {
  const externalSocials = SOCIAL_LINKS.filter((link) =>
    link.href.startsWith('http'),
  ).map((link) => link.href)

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.author,
    url: siteUrl.toString(),
    description: SITE.description,
    sameAs: externalSocials,
  }
}

export function websiteSchema(siteUrl: URL): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.title,
    url: siteUrl.toString(),
    description: SITE.description,
    inLanguage: SITE.locale,
    author: {
      '@type': 'Person',
      name: SITE.author,
    },
    // SearchAction target points at the real /search page, which is a
    // crawlable route - see src/pages/search.astro. Google used to
    // surface this as a sitelinks search box; as of ~2024 they've pulled
    // back on rendering it, but the schema is still valid and other
    // tools (DuckDuckGo, some social previews) still use it.
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: new URL(
          '/search?q={search_term_string}',
          siteUrl,
        ).toString(),
      },
      // schema.org requires the placeholder name be listed out-of-band.
      'query-input': 'required name=search_term_string',
    },
  }
}

export type BlogPostingInput = {
  title: string
  description: string
  datePublished: Date
  dateModified?: Date
  authors: string[]
  imageUrl: URL | null
  canonicalUrl: URL
  tags: string[]
  wordCount?: number
}

export function blogPostingSchema(input: BlogPostingInput): JsonLd {
  const schema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    datePublished: input.datePublished.toISOString(),
    dateModified: (input.dateModified ?? input.datePublished).toISOString(),
    author: input.authors.map((name) => ({
      '@type': 'Person',
      name,
    })),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.canonicalUrl.toString(),
    },
    publisher: {
      '@type': 'Person',
      name: SITE.author,
    },
    keywords: input.tags,
    inLanguage: SITE.locale,
  }

  if (input.imageUrl) {
    schema.image = input.imageUrl.toString()
  }
  if (typeof input.wordCount === 'number' && input.wordCount > 0) {
    schema.wordCount = input.wordCount
  }

  return schema
}

export type BreadcrumbEntry = {
  name: string
  url: URL
}

export function breadcrumbListSchema(items: BreadcrumbEntry[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.toString(),
    })),
  }
}
