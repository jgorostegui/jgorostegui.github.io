// Post figures: model switch, entrance motion and the hover/focus readout.
// Every figure is complete without this script; it only adds interaction.

type Arm = [mean: number, lo: number, hi: number, turns: number, n: number]
interface CostRow {
  t: string
  m: Record<string, { name: string; mcp: Arm; cli: Arm; d: string }>
}
interface GrowthPanel {
  t: string
  n: number
  s: Record<string, { cli: number[]; mcp: number[] }>
}

// Means and CI bounds as stored in summary-stats.json (6 decimals). Both share that precision: re-rounding the
// stored bounds can break ties the wrong way, and a mean rounded coarser than its bounds can show outside them
const usd6 = (v: number) => '$' + v.toFixed(6)
const tok = (v: number) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
// Entrance observers still waiting; ClientRouter swaps the page without a reload, so they are released on swap
const waiting = new Set<IntersectionObserver>()

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text != null) e.textContent = text
  return e
}

function tipRow(color: string, label: string, value: string, extra?: string) {
  const r = el('p', 'viz-tip-r')
  const k = el('i')
  k.style.setProperty('--c', color)
  const name = el('span', '', label)
  const v = el('b', '', value)
  r.append(k, name, v)
  if (extra) {
    const x = el('span', '', extra)
    x.style.gridColumn = '2 / -1'
    x.style.fontFamily = 'var(--font-mono)'
    x.style.fontSize = '0.6875rem'
    r.append(x)
  }
  return r
}

// Place the readout next to an anchor rect, inside the figure.
function place(tip: HTMLElement, fig: HTMLElement, x: number, y: number) {
  const f = fig.getBoundingClientRect()
  tip.hidden = false
  const w = tip.offsetWidth
  const h = tip.offsetHeight
  let left = x - f.left + 14
  if (left + w > f.width - 8) left = x - f.left - w - 14
  left = Math.max(8, left)
  let top = y - f.top - h / 2
  top = Math.max(8, Math.min(top, f.height - h - 8))
  tip.style.left = `${left}px`
  tip.style.top = `${top}px`
}

function initSwitch(fig: HTMLElement, onChange?: () => void) {
  const buttons = [...fig.querySelectorAll<HTMLButtonElement>('.viz-seg button')]
  for (const b of buttons) {
    b.addEventListener('click', () => {
      fig.dataset.model = b.dataset.set
      for (const o of buttons) o.setAttribute('aria-pressed', String(o === b))
      onChange?.()
    })
  }
}

function initReveal(fig: HTMLElement) {
  if (reduced() || !('IntersectionObserver' in window)) return
  const r = fig.getBoundingClientRect()
  if (r.top < innerHeight * 0.85 && r.bottom > 0) return // already on screen: no motion
  fig.classList.add('is-pre')
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect()
        waiting.delete(io)
        requestAnimationFrame(() => fig.classList.remove('is-pre'))
      }
    },
    { threshold: 0.35 },
  )
  io.observe(fig)
  waiting.add(io)
}

function initCost(fig: HTMLElement) {
  const tip = fig.querySelector<HTMLElement>('.viz-tip')!
  let hot: HTMLElement | null = null
  const show = (row: HTMLElement, x: number, y: number) => {
    const d = JSON.parse(row.dataset.v!) as CostRow
    const m = d.m[fig.dataset.model!]
    const arm = (a: Arm) => `95% CI ${usd6(a[1])} to ${usd6(a[2])} · ${a[3].toFixed(1)} mean turns`
    tip.replaceChildren(
      el('p', 'viz-tip-h', `${d.t} · ${m.name}`),
      tipRow('var(--c-mcp)', 'Notion MCP', usd6(m.mcp[0]), arm(m.mcp)),
      tipRow('var(--c-cli)', 'Notion Agent CLI', usd6(m.cli[0]), arm(m.cli)),
      el('p', 'viz-tip-f', `CLI vs MCP ${m.d} · n = ${m.cli[4]} runs each`),
    )
    place(tip, fig, x, y)
  }
  const hide = () => {
    tip.hidden = true
    hot = null
  }
  for (const row of fig.querySelectorAll<HTMLElement>('.vc-row')) {
    row.addEventListener('pointermove', (e) => {
      hot = row
      show(row, e.clientX, e.clientY)
    })
    row.addEventListener('pointerleave', hide)
    row.addEventListener('focus', () => {
      const r = row.querySelector('.vc-track')!.getBoundingClientRect()
      hot = row
      show(row, r.left + r.width * 0.6, r.top + r.height / 2)
    })
    row.addEventListener('blur', hide)
  }
  fig.addEventListener('viz:dismiss', hide)
  initSwitch(fig, () => {
    if (hot) {
      const r = hot.getBoundingClientRect()
      show(hot, r.left + r.width * 0.6, r.top + r.height / 2)
    }
  })
}

function initGrowth(fig: HTMLElement) {
  const tip = fig.querySelector<HTMLElement>('.viz-tip')!
  initSwitch(fig, () => (tip.hidden = true))
  for (const area of fig.querySelectorAll<HTMLElement>('.vg-area')) {
    const p = JSON.parse(area.dataset.p!) as GrowthPanel
    const cross = area.querySelector<HTMLElement>('.vg-cross')!
    const move = (clientX: number) => {
      const r = area.getBoundingClientRect()
      const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
      const turn = Math.round(f * (p.n - 1)) + 1
      const s = p.s[fig.dataset.model!]
      cross.style.setProperty('--x', String((turn - 1) / (p.n - 1)))
      cross.hidden = false
      const at = (v: number[]) => (turn <= v.length ? tok(v[turn - 1]) : '–')
      const end = (v: number[]) => (turn > v.length ? `ended at logical turn ${v.length}, ${tok(v[v.length - 1])}` : undefined)
      tip.replaceChildren(
        el('p', 'viz-tip-h', `${p.t} · logical turn ${turn}`),
        tipRow('var(--c-mcp)', 'Notion MCP', at(s.mcp), end(s.mcp)),
        tipRow('var(--c-cli)', 'Notion Agent CLI', at(s.cli), end(s.cli)),
      )
      place(tip, fig, r.left + r.width * ((turn - 1) / (p.n - 1)), r.top + r.height / 2)
    }
    area.addEventListener('pointermove', (e) => move(e.clientX))
    const off = () => {
      tip.hidden = true
      cross.hidden = true
    }
    area.addEventListener('pointerleave', off)
    fig.addEventListener('viz:dismiss', off)
  }
}

let installed = false

export function initViz() {
  const run = () => {
    for (const fig of document.querySelectorAll<HTMLElement>('.viz[data-viz]')) {
      if (fig.dataset.ready) continue
      fig.dataset.ready = '1'
      if (fig.dataset.viz === 'cost') initCost(fig)
      if (fig.dataset.viz === 'growth') initGrowth(fig)
      initReveal(fig)
    }
  }
  run()
  // Two figure components call this; the document listeners go on once
  if (installed) return
  installed = true
  document.addEventListener('astro:page-load', run)
  document.addEventListener('astro:before-swap', () => {
    for (const io of waiting) io.disconnect()
    waiting.clear()
  })
  // Esc closes the readout, whether it came from the pointer or the keyboard; the focus stays where it is
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    for (const fig of document.querySelectorAll('.viz[data-viz]')) fig.dispatchEvent(new Event('viz:dismiss'))
  })
}
