import type { APIRoute, GetStaticPaths } from 'astro'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
// @ts-expect-error - wawoff2 ships no type declarations.
import wawoff2 from 'wawoff2'

import { getAllPosts } from '@/lib/data-utils'
import { OgTemplate, type OgTemplateProps } from '@/lib/og-template'

/**
 * Dynamic OG image endpoint.
 *
 * Emits:
 *   /og/default.png                  - fallback for non-post pages
 *   /og/<post-slug>.png              - per-post card for each blog post
 *
 * Gated by the ENABLE_OG_IMAGES env var. When disabled, getStaticPaths()
 * returns [] and the endpoint emits zero files - any existing <meta
 * property="og:image"> references should be wrapped in a flag check so
 * they don't link to 404s.
 *
 * Runs at build time in SSG mode. Rasterizes the JSX template to SVG
 * via Satori, then SVG→PNG via resvg (native Rust; chosen over Sharp's
 * libvips binding for smaller CI footprint).
 *
 * Fonts are loaded from `@fontsource/*` packages rather than the
 * `public/fonts/*VF.woff2` variable fonts used by the site itself.
 * Reason: Satori's embedded opentype.js parser cannot read variable
 * font name tables and errors with `undefined is not an object
 * (evaluating 'names[p.parseUShort()]')`. The fontsource packages ship
 * per-weight static woff2, which we decompress to TTF via wawoff2
 * before handing to Satori.
 *
 * Font decompression is cached in a module-level singleton so it runs
 * once per build regardless of how many OG paths are emitted.
 */

const WIDTH = 1200
const HEIGHT = 630

type RouteProps = OgTemplateProps

type CachedFonts = {
  geist400: Buffer
  geist600: Buffer
  jetbrains400: Buffer
}
let fontCache: CachedFonts | null = null

async function loadFont(relativePath: string): Promise<Buffer> {
  const full = path.resolve(process.cwd(), 'node_modules', relativePath)
  const woff2 = await fs.readFile(full)
  const ttf = (await wawoff2.decompress(woff2)) as Uint8Array
  return Buffer.from(ttf)
}

async function loadFonts(): Promise<CachedFonts> {
  if (fontCache) return fontCache

  const [geist400, geist600, jetbrains400] = await Promise.all([
    loadFont('@fontsource/geist/files/geist-latin-400-normal.woff2'),
    loadFont('@fontsource/geist/files/geist-latin-600-normal.woff2'),
    loadFont(
      '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
    ),
  ])

  fontCache = { geist400, geist600, jetbrains400 }
  return fontCache
}

export const getStaticPaths: GetStaticPaths = async () => {
  if (import.meta.env.ENABLE_OG_IMAGES !== 'true') {
    return []
  }

  const posts = await getAllPosts()

  const postPaths = posts.map((post) => ({
    params: { slug: post.id },
    props: {
      kind: 'post' as const,
      title: post.data.title,
      date: post.data.date,
      tags: post.data.tags ?? [],
    } satisfies RouteProps,
  }))

  return [
    {
      params: { slug: 'default' },
      props: { kind: 'default' as const } satisfies RouteProps,
    },
    ...postPaths,
  ]
}

export const GET: APIRoute = async ({ props }) => {
  const routeProps = props as RouteProps
  const { geist400, geist600, jetbrains400 } = await loadFonts()

  const svg = await satori(OgTemplate(routeProps), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Geist', data: geist400, weight: 400, style: 'normal' },
      { name: 'Geist', data: geist600, weight: 600, style: 'normal' },
      {
        name: 'JetBrainsMono',
        data: jetbrains400,
        weight: 400,
        style: 'normal',
      },
    ],
  })

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
    .render()
    .asPng()

  // Wrap Node Buffer in a Uint8Array view so the Response constructor
  // accepts it - the DOM BodyInit union doesn't include Buffer directly.
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
