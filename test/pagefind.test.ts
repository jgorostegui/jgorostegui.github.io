import { describe, expect, test } from 'bun:test'

import { createPagefindLoader, type PagefindAPI } from '../src/lib/pagefind'

function createAPI(): PagefindAPI {
  return {
    init: async () => {},
    search: async () => ({ results: [] }),
    options: async () => {},
  }
}

describe('createPagefindLoader', () => {
  test('uses createInstance with the production search options', async () => {
    const calls: unknown[] = []
    const api = createAPI()
    const loadPagefind = createPagefindLoader(async () => ({
      ...api,
      createInstance: (opts) => {
        calls.push(opts)
        return api
      },
    }))

    await loadPagefind()

    expect(calls).toEqual([
      {
        baseUrl: '/',
        excerptLength: 30,
        noWorker: true,
      },
    ])
  })

  test('retries after a transient import failure', async () => {
    let attempts = 0
    const api = createAPI()
    const loadPagefind = createPagefindLoader(async () => {
      attempts += 1
      if (attempts === 1) {
        throw new Error('temporary failure')
      }

      return {
        ...api,
        createInstance: () => api,
      }
    })

    try {
      await loadPagefind()
      throw new Error('expected first load to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('temporary failure')
    }

    const result = await loadPagefind()
    expect(result).toBe(api)
    expect(attempts).toBe(2)
  })
})
