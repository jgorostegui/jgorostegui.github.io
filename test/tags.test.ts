import { describe, expect, test } from 'bun:test'

import { createTagSummaries, slugifyTag } from '../src/lib/tags'

describe('slugifyTag', () => {
  test('creates stable lowercase slugs for current tag labels', () => {
    expect(slugifyTag('AI Agents')).toBe('ai-agents')
    expect(slugifyTag('Spec-Driven Development')).toBe(
      'spec-driven-development',
    )
    expect(slugifyTag('MLOps')).toBe('mlops')
  })

  test('keeps common programming tags distinct', () => {
    expect(slugifyTag('C++')).toBe('c-plus-plus')
    expect(slugifyTag('C#')).toBe('c-sharp')
  })

  test('falls back to a non-empty slug for symbol-only labels', () => {
    expect(slugifyTag('⚙️')).toMatch(/^tag-[a-z0-9]+$/)
  })
})

describe('createTagSummaries', () => {
  test('merges tags by canonical slug and keeps the preferred display label', () => {
    const summaries = createTagSummaries(['software', 'Software', 'AI'])

    expect([...summaries.values()]).toEqual([
      { slug: 'software', tag: 'Software', count: 2 },
      { slug: 'ai', tag: 'AI', count: 1 },
    ])
  })
})
