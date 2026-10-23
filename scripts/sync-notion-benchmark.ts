#!/usr/bin/env bun
export {}
/**
 * Regenerates the benchmark data of the post wrong-abstraction-agent-tools
 * from a checkout of jgorostegui/notion-agent-cli.
 *
 * Usage (from the repo root):
 *   bun scripts/sync-notion-benchmark.ts <notion-agent-cli-checkout> [--check]
 *
 * Inputs (inside the checkout):
 *   benchmark/assets/summary-stats.json: written by the notebook's export cell
 *   benchmark/analysis.ipynb: the cell that builds bench-cumulative (cell 24
 *     at a0fe33a) keeps its Plotly figure as saved output
 *
 * Outputs (into src/content/blog/wrong-abstraction-agent-tools/data/):
 *   summary-stats.json: byte copy of the input
 *   cumulative-tokens.json: one cumulative billed-token series per scenario,
 *     interface and model, decoded from the figure (Plotly stores y as
 *     base64 typed arrays)
 *
 * With --check nothing is written: each output is reported as unchanged or
 * different, and the exit code is 1 if any differs.
 *
 * The post's data come from commit a0fe33a. To get a checkout at a given commit:
 *   git clone https://github.com/jgorostegui/notion-agent-cli.git
 *   git -C notion-agent-cli checkout a0fe33a
 *
 * When the checkout is a git repo, its HEAD goes into the "source" field of
 * cumulative-tokens.json. A folder without .git is accepted only if both
 * inputs match the a0fe33a blobs, so the field never names the wrong commit.
 */

import { createHash } from 'node:crypto'
import { existsSync, realpathSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const TAG = '[notion-benchmark]'
const POST_DATA_DIR = resolve(
  process.cwd(),
  'src/content/blog/wrong-abstraction-agent-tools/data',
)

const SUMMARY_PATH = 'benchmark/assets/summary-stats.json'
const NOTEBOOK_PATH = 'benchmark/analysis.ipynb'

// Commit the post's data come from, with the git blob SHAs of both inputs at
// that commit (from the GitHub tree API). They identify a plain copy.
const PINNED_COMMIT = 'a0fe33a'
const PINNED_BLOBS: Record<string, string> = {
  [SUMMARY_PATH]: 'f827f3fec9d2c1654aceb0b6697451785efff654',
  [NOTEBOOK_PATH]: 'ef69c91d1e2a006180bfd4be44fe222d7d8c5350',
}

// The figure cell registers itself under this key for the PNG export, and
// the measure text below holds only while its code keeps these fragments.
const FIGURE_MARKER = 'charts["bench-cumulative"]'
const EXPECTED_CELL = 24
const MEASURE =
  'cumulative billed input tokens (input + cache creation) per logical turn, iteration 1'
const MEASURE_FRAGMENTS = ['"billed"', 'df.iteration == 1', 'np.cumsum(']

// Legend groups are the notebook's condition labels, e.g. "Notion MCP (Opus)".
const INTERFACES: Record<string, string> = {
  'Notion Agent CLI': 'cli',
  'Notion MCP': 'mcp',
}

const TYPED_ARRAYS = {
  i1: Int8Array,
  u1: Uint8Array,
  i2: Int16Array,
  u2: Uint16Array,
  i4: Int32Array,
  u4: Uint32Array,
  f4: Float32Array,
  f8: Float64Array,
}

type NotebookCell = {
  cell_type: string
  source: string | string[]
  outputs?: { output_type: string; data?: Record<string, unknown> }[]
}
type Axis = { domain: [number, number]; anchor: string }
type Annotation = { text: string; x: number; y: number; xref?: string; yref?: string }
type PlotlyArray = number[] | { dtype: string; bdata: string; shape?: unknown }
type Trace = {
  type?: string
  legendgroup?: string
  xaxis?: string
  yaxis?: string
  x: PlotlyArray
  y: PlotlyArray
}
type Figure = {
  data: Trace[]
  layout: Record<string, unknown> & { annotations?: Annotation[] }
}

class SyncError extends Error {}

function fail(message: string): never {
  throw new SyncError(message)
}

// Run git inside the checkout; null when it fails or git is missing.
function git(cwd: string, args: string[]): string | null {
  try {
    const proc = Bun.spawnSync(['git', '-C', cwd, ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    return proc.exitCode === 0 ? proc.stdout.toString().trim() : null
  } catch {
    return null
  }
}

// Same hash as `git hash-object`, to recognise a plain copy of a commit.
function blobSha(bytes: Buffer): string {
  return createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex')
}

// Work out which commit the inputs come from. The checkout must be the
// repo's top level, otherwise HEAD would belong to an enclosing repo.
function resolveCommit(checkout: string, inputs: Record<string, Buffer>): string {
  const top = git(checkout, ['rev-parse', '--show-toplevel'])
  if (top !== null && realpathSync(top) === realpathSync(checkout)) {
    const head = git(checkout, ['rev-parse', 'HEAD']) ?? fail(`cannot read HEAD of ${checkout}`)
    console.log(`${TAG} git HEAD: ${head}`)
    const dirty = git(checkout, ['status', '--porcelain', '--', ...Object.keys(inputs)])
    if (dirty) {
      fail(`uncommitted changes in the inputs, HEAD would not describe them:\n${dirty}`)
    }
    return head.slice(0, 7)
  }

  console.log(`${TAG} not a git checkout, comparing inputs with ${PINNED_COMMIT}`)
  for (const [path, bytes] of Object.entries(inputs)) {
    if (blobSha(bytes) !== PINNED_BLOBS[path]) {
      fail(
        `${path} does not match ${PINNED_COMMIT} and the folder has no git ` +
          'history to name its commit. Use a git clone (see the header).',
      )
    }
  }
  return PINNED_COMMIT
}

function cellSource(cell: NotebookCell): string {
  return Array.isArray(cell.source) ? cell.source.join('') : cell.source
}

// Locate the figure cell by its content and return its index and figure.
function findFigure(notebook: { cells: NotebookCell[] }): { index: number; figure: Figure } {
  const matches = notebook.cells.flatMap((cell, index) =>
    cell.cell_type === 'code' && cellSource(cell).includes(FIGURE_MARKER) ? [index] : [],
  )
  if (matches.length !== 1) {
    fail(
      `expected one code cell containing ${FIGURE_MARKER}, found ${matches.length}. ` +
        'The cumulative-token figure was removed, renamed or duplicated.',
    )
  }
  const index = matches[0]
  if (index !== EXPECTED_CELL) {
    console.log(`${TAG} note: figure found at cell ${index}, not ${EXPECTED_CELL}`)
  }

  const cell = notebook.cells[index]
  const source = cellSource(cell)
  const missing = MEASURE_FRAGMENTS.filter((fragment) => !source.includes(fragment))
  if (missing.length > 0) {
    fail(
      `cell ${index} no longer contains ${missing.join(', ')}. ` +
        'Check that MEASURE in this script still describes the figure.',
    )
  }

  const figures = (cell.outputs ?? []).flatMap((output) => {
    const figure = output.data?.['application/vnd.plotly.v1+json']
    return figure ? [figure as Figure] : []
  })
  if (figures.length !== 1) {
    fail(`cell ${index} has ${figures.length} saved Plotly outputs, expected 1. Re-run the notebook.`)
  }
  return { index, figure: figures[0] }
}

// Plotly.py 6 saves numpy arrays as { dtype, bdata } with little-endian bytes.
function decodeArray(value: PlotlyArray, what: string): number[] {
  if (Array.isArray(value)) return value
  const TypedArray = TYPED_ARRAYS[value.dtype as keyof typeof TYPED_ARRAYS]
  if (!TypedArray || value.shape !== undefined) {
    fail(`${what}: unsupported encoding (dtype ${value.dtype}, shape ${JSON.stringify(value.shape)})`)
  }
  // Copy into a fresh buffer: typed arrays need an aligned offset.
  const bytes = Uint8Array.from(Buffer.from(value.bdata, 'base64'))
  return Array.from(new TypedArray(bytes.buffer))
}

// Subplot titles are annotations centred over each x axis and sitting on
// top of its y axis. Returns the scenario of each x axis key ("x", "x2"...).
function subplotScenarios(layout: Figure['layout']): Map<string, { id: string; name: string }> {
  const scenarios = new Map<string, { id: string; name: string }>()
  const axisKeys = Object.keys(layout)
    .filter((key) => /^xaxis\d*$/.test(key))
    .sort((a, b) => Number(a.slice(5) || 1) - Number(b.slice(5) || 1))

  for (const key of axisKeys) {
    const xaxis = layout[key] as Axis
    const yaxis = layout[`yaxis${xaxis.anchor.slice(1)}`] as Axis | undefined
    if (!yaxis) fail(`${key} is anchored to a missing y axis (${xaxis.anchor})`)
    const centre = (xaxis.domain[0] + xaxis.domain[1]) / 2
    const titles = (layout.annotations ?? []).filter(
      (a) =>
        a.xref === 'paper' &&
        a.yref === 'paper' &&
        Math.abs(a.x - centre) < 1e-9 &&
        Math.abs(a.y - yaxis.domain[1]) < 1e-9,
    )
    const match = titles.length === 1 ? /^(S\d+) (.+)$/.exec(titles[0].text) : null
    if (!match) {
      fail(`no "S<n> <name>" subplot title above ${key} (found ${titles.length} candidates)`)
    }
    scenarios.set(`x${key.slice(5)}`, { id: match[1], name: match[2] })
  }
  if (scenarios.size === 0) fail('the figure has no subplots')
  return scenarios
}

// Rebuild cumulative-tokens.json from the figure, keeping the trace order.
function buildCumulative(index: number, figure: Figure, commit: string) {
  const scenarios = subplotScenarios(figure.layout)
  const seen = new Set<string>()

  const series = figure.data.map((trace, i) => {
    const what = `trace ${i} (${trace.legendgroup})`
    const scenario = scenarios.get(trace.xaxis ?? 'x')
    if ((trace.type ?? 'scatter') !== 'scatter' || !scenario) {
      fail(`${what}: expected a scatter trace on a titled subplot`)
    }
    const label = /^(.+) \(([^)]+)\)$/.exec(trace.legendgroup ?? '')
    const iface = label ? INTERFACES[label[1]] : undefined
    if (!label || !iface) fail(`${what}: legend group is not "<interface> (<model>)"`)
    const model = label[2].toLowerCase()

    const x = decodeArray(trace.x, `${what} x`)
    const y = decodeArray(trace.y, `${what} y`)
    if (x.length !== y.length || x.some((turn, t) => turn !== t + 1)) {
      fail(`${what}: x is not the turn sequence 1..${y.length}`)
    }
    if (!y.every(Number.isSafeInteger)) fail(`${what}: y holds non-integer token counts`)

    const key = `${scenario.id}/${iface}/${model}`
    if (seen.has(key)) fail(`${what}: duplicate series ${key}`)
    seen.add(key)
    return { scenario: scenario.id, interface: iface, model, billed_cumulative: y }
  })

  return {
    source:
      `jgorostegui/notion-agent-cli@${commit}, ${NOTEBOOK_PATH} cell ${index} ` +
      '(saved Plotly output, the data behind benchmark/assets/bench-cumulative.png)',
    measure: MEASURE,
    scenarios: [...scenarios.values()],
    series,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const paths = args.filter((arg) => arg !== '--check')
  if (paths.length !== 1 || paths[0].startsWith('-')) {
    console.error('usage: bun scripts/sync-notion-benchmark.ts <notion-agent-cli-checkout> [--check]')
    process.exit(2)
  }
  const checkout = resolve(paths[0])
  if (!existsSync(POST_DATA_DIR)) {
    fail(`${POST_DATA_DIR} not found. Run the script from the blog repo root.`)
  }
  console.log(`${TAG} checkout: ${checkout}`)

  const inputs: Record<string, Buffer> = {}
  for (const path of [SUMMARY_PATH, NOTEBOOK_PATH]) {
    const full = resolve(checkout, path)
    if (!existsSync(full)) fail(`${full} not found. Is this a notion-agent-cli checkout?`)
    inputs[path] = await readFile(full)
  }
  const commit = resolveCommit(checkout, inputs)

  const { index, figure } = findFigure(JSON.parse(inputs[NOTEBOOK_PATH].toString('utf8')))
  const cumulative = buildCumulative(index, figure, commit)

  // One-space indent and a trailing newline.
  const outputs: Record<string, Buffer> = {
    'summary-stats.json': inputs[SUMMARY_PATH],
    'cumulative-tokens.json': Buffer.from(`${JSON.stringify(cumulative, null, 1)}\n`),
  }

  let changed = 0
  for (const [name, bytes] of Object.entries(outputs)) {
    const outPath = resolve(POST_DATA_DIR, name)
    const current = existsSync(outPath) ? await readFile(outPath) : null
    if (current?.equals(bytes)) {
      console.log(`${TAG} unchanged ${name}`)
      continue
    }
    changed++
    if (check) {
      console.log(`${TAG} differs ${name}${current ? '' : ' (missing)'}`)
    } else {
      await writeFile(outPath, bytes)
      console.log(`${TAG} wrote ${name} (${bytes.length}B)`)
    }
  }

  if (check && changed > 0) {
    console.error(`${TAG} ${changed} file(s) out of date, run without --check to update`)
    process.exit(1)
  }
}

try {
  await main()
} catch (error) {
  if (!(error instanceof SyncError)) throw error
  console.error(`${TAG} error: ${error.message}`)
  process.exit(2)
}
