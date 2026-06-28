export type TagSummary = {
  tag: string
  slug: string
  count: number
}

export function slugifyTag(tag: string): string {
  const slug = tag
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `tag-${hashTag(tag)}`
}

export function createTagSummaries(
  tags: Iterable<string>,
): Map<string, TagSummary> {
  const summaries = new Map<string, TagSummary>()

  for (const tag of tags) {
    const slug = slugifyTag(tag)
    const current = summaries.get(slug)

    summaries.set(slug, {
      slug,
      tag: current ? getPreferredTagLabel(current.tag, tag) : tag,
      count: (current?.count || 0) + 1,
    })
  }

  return summaries
}

function getPreferredTagLabel(current: string, next: string): string {
  if (current === current.toLowerCase() && next !== next.toLowerCase()) {
    return next
  }

  return current
}

function hashTag(tag: string): string {
  let hash = 5381

  for (const char of tag.trim()) {
    hash = (hash * 33) ^ char.codePointAt(0)!
  }

  return (hash >>> 0).toString(36)
}
