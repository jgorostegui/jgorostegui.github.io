#!/usr/bin/env bun
export {}
/**
 * Regenerates every favicon asset from public/favicon.svg.
 *
 * One-shot script: run it whenever public/favicon.svg changes. Uses the
 * already-installed @resvg/resvg-js (shipped for the OG image pipeline)
 * to avoid pulling in Sharp just for 6 PNGs.
 *
 * Outputs (all into public/):
 *   favicon-96x96.png            — 96x96
 *   apple-touch-icon.png         — 180x180
 *   web-app-manifest-192x192.png — 192x192
 *   web-app-manifest-512x512.png — 512x512
 *   favicon.ico                  — 32x32 + 48x48 (PNG-in-ICO container)
 *
 * The ICO container is hand-rolled because ICO is a simple 38-byte
 * header + inlined PNG blobs, and `png-to-ico` would be a one-use dep.
 * ICO format reference:
 *   https://en.wikipedia.org/wiki/ICO_(file_format)
 */

import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SVG_PATH = resolve(process.cwd(), 'public', 'favicon.svg')
const PUBLIC_DIR = resolve(process.cwd(), 'public')

type PngOutput = { size: number; filename: string }

const PNG_OUTPUTS: PngOutput[] = [
  { size: 96, filename: 'favicon-96x96.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 192, filename: 'web-app-manifest-192x192.png' },
  { size: 512, filename: 'web-app-manifest-512x512.png' },
]

// Rasterize SVG to a PNG Buffer at a given width.
function render(svg: string, size: number): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  })
    .render()
    .asPng()
}

// Build a PNG-in-ICO file from a list of {size, pngBytes} entries.
// ICO layout: [ICONDIR(6)] [ICONDIRENTRY(16) * n] [image data...]
function buildIco(
  entries: { size: number; png: Buffer }[],
): Buffer {
  const headerSize = 6 + 16 * entries.length
  const parts: Buffer[] = []

  // ICONDIR header
  const dir = Buffer.alloc(6)
  dir.writeUInt16LE(0, 0) // reserved
  dir.writeUInt16LE(1, 2) // type: 1 = ICO
  dir.writeUInt16LE(entries.length, 4) // count
  parts.push(dir)

  // ICONDIRENTRY per image
  let dataOffset = headerSize
  for (const { size, png } of entries) {
    const entry = Buffer.alloc(16)
    // Width/height are stored in a single byte each; 0 means 256.
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size (0 = no palette, true color)
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(png.length, 8) // image data size
    entry.writeUInt32LE(dataOffset, 12) // image data offset
    parts.push(entry)
    dataOffset += png.length
  }

  // Image data
  for (const { png } of entries) {
    parts.push(png)
  }

  return Buffer.concat(parts)
}

async function main() {
  const svg = await readFile(SVG_PATH, 'utf8')
  console.log('[favicons] source:', SVG_PATH)

  // PNG outputs
  for (const { size, filename } of PNG_OUTPUTS) {
    const png = render(svg, size)
    const outPath = resolve(PUBLIC_DIR, filename)
    await writeFile(outPath, png)
    console.log(`[favicons] wrote ${filename} (${size}x${size}, ${png.length}B)`)
  }

  // ICO: 32 + 48 embedded PNGs
  const ico32 = render(svg, 32)
  const ico48 = render(svg, 48)
  const ico = buildIco([
    { size: 32, png: ico32 },
    { size: 48, png: ico48 },
  ])
  const icoPath = resolve(PUBLIC_DIR, 'favicon.ico')
  await writeFile(icoPath, ico)
  console.log(`[favicons] wrote favicon.ico (32+48, ${ico.length}B)`)
}

await main()
