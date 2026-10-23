// Setup hero: Josu's corner in pixel art (canvas). A module with its sprites, bundled and cached by the browser;
// setup-hero.astro mounts it on every visit to the home page (ClientRouter swaps pages without reloading). The run is
// torn down on astro:before-swap (loop, observers and document listeners).
import art from './setup-sprites.json'

// The run in progress, so a new mount (or leaving the page) can stop it
let stopRun = null

// Josu's real corner, drawn from photos, in colour pixel art with a limited palette. The anthracite L-shaped desk,
// the curved ultrawide monitor, the glass tower with two plants on top, the pegboard with its keyboards, the white
// lamp with an articulated arm and the homelab in the low cabinet beside the desk. Josu types with his back to you;
// when the hero comes into view or you point at him, he swivels his chair, looks at you and goes back to work.
// Every pixel is a material; the theme (the light in the room) and the lights (screen, lamp, RGB) set its colour.
export function mountHero() {
  const hero = document.getElementById('px-hero')
  const canvas = document.getElementById('px')
  // once per page: a new visit brings a new canvas
  if (!canvas || canvas.dataset.mounted) return
  canvas.dataset.mounted = '1'
  stopRun?.()
  let dead = false
  const hot = document.getElementById('px-hot')
  const typer = document.getElementById('px-type') // real text field (invisible) over his terminal
  if (!hero || !canvas) return
  const who = hero.querySelector('.px-who')
  const name = who.querySelector('h1')
  const cur = who.querySelector('.cur')
  const labelLamp = canvas.getAttribute('aria-label')
  const ART = art
  const SP = ART.sprites
  const PAL = ART.pal
  const EX = ART.extra
  const FONT = ART.font
  const MAT = ART.mats
  const ctx = canvas.getContext('2d')
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  let reduced = motionQuery.matches
  const theme = () => (PAL[document.documentElement.dataset.theme] ? document.documentElement.dataset.theme : 'dark')

  // 4x4 ordered dither: mixes two palette colours without inventing a third.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
  const dith = (x, y, t) => BAYER[(y & 3) * 4 + (x & 3)] < t * 16
  function rng(seed) {
    let s = seed >>> 0
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  }
  const u32 = (h) => (0xff000000 | (parseInt(h.slice(5, 7), 16) << 16) | (parseInt(h.slice(3, 5), 16) << 8) | parseInt(h.slice(1, 3), 16)) >>> 0

  // ---- Materials -------------------------------------------------------------------------------------------
  const C = {}
  ;[...MAT].forEach((ch, i) => (C[ch] = i + 1))
  const NMAT = MAT.length + 1
  const SPR = {}
  for (const [n, g] of Object.entries(SP)) {
    const h = g.length
    const w = g[0].length
    const a = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = g[y][x] === '.' ? 0 : C[g[y][x]]
    SPR[n] = { w, h, a }
  }
  const Wd = (n) => SPR[n].w
  const Ht = (n) => SPR[n].h
  const POSE = EX.pose
  const HOLE = C.O
  const KB = { k60: 'white 60% keyboard', tklB: 'blue and white keyboard', tklK: 'black keyboard with green backlight' }

  // ---- State -----------------------------------------------------------------------------------------------
  let S = 3
  let NW = 0
  let NH = 0
  let M = new Uint8Array(0) // materials of the current frame
  let MS = new Uint8Array(0) // materials of the static scene
  let OWN = new Uint8Array(0) // 1: Josu (for the rim light and the face light)
  let LT = new Uint8Array(0) // light: 0 base, 1 edge of the lamp light, 2 lamp, 3 screen
  let BG = new Uint32Array(0)
  let img = null
  let F = new Uint32Array(0)
  const L = {}
  let wide = true
  let tick = 0
  const lampOn = { light: false, dark: true, cyberpunk: false }
  const RGBM = ['wave', 'breath', 'static', 'off']
  const rgbMode = { light: 0, dark: 0, cyberpunk: 0 }
  let rgbHue = 0
  let labBurst = 0
  let bgKey = ''
  let lightKey = ''

  // Keyboards: two on the pegboard and one on the desk; they swap places.
  const slots = [{ id: 'k60' }, { id: 'tklB' }]
  let deskKb = 'tklK'
  let flight = null

  // Josu: 0 from behind, 1 in profile, 2 facing you. He turns towards target one step at a time.
  const POSES = ['B', 'P', 'F']
  let poseIdx = 0
  let target = 0
  let stepT = 0
  let frontAt = -1
  let holdTo = 0
  let pointedAt = false
  let typingFrame = 0
  let burst = 0
  let pause = 30
  let nextBlink = 60
  let pointer = null

  // ---- Painting materials ----------------------------------------------------------------------------------
  function pm(x, y, ch) {
    if (x >= 0 && y >= 0 && x < NW && y < NH) M[y * NW + x] = typeof ch === 'number' ? ch : C[ch]
  }
  function rect(x, y, w, h, ch) {
    const c = C[ch]
    for (let j = Math.max(0, y); j < Math.min(NH, y + h); j++) for (let i = Math.max(0, x); i < Math.min(NW, x + w); i++) M[j * NW + i] = c
  }
  function blit(n, x, y, own = 0) {
    const s = SPR[n]
    for (let j = 0; j < s.h; j++) {
      const Y = y + j
      if (Y < 0 || Y >= NH) continue
      for (let i = 0; i < s.w; i++) {
        const c = s.a[j * s.w + i]
        const X = x + i
        if (c && X >= 0 && X < NW) {
          M[Y * NW + X] = c
          if (own) OWN[Y * NW + X] = own
        }
      }
    }
  }
  function cable(x0, y0, x1, y1, drop) {
    const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) + Math.abs(y1 - y0) + drop * 2))
    for (let i = 0; i <= n; i++) {
      const t = i / n
      pm(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + drop * 4 * t * (1 - t)), 'k')
    }
  }

  // ---- Geometry ----------------------------------------------------------------------------------------------
  // Everything depends on two numbers: Jx (centre of the chair) and Yd (front edge of the desk).
  const DK = 16 // visible depth of the desk top
  // On phones (narrow) the composition fits the width: monitor and pegboard a little narrower, the pegboard moves down
  // to the return's wall by the tower (so the scene is shorter) and, if it still does not fit, the lamp goes first.
  let NAR = { MW: 96, pegW: 84, lamp: true, low: true, pi: true }
  function place(Jx, Yd) {
    const o = {}
    o.Jx = Jx
    o.Yd = Yd
    o.B = Yd + 48 // where wall meets floor
    o.FY = Yd + 54 // where the front legs stand
    o.NH = Yd + 68
    o.MW = wide ? 110 : NAR.MW
    o.MH = 34
    o.mon = { x: Jx - (o.MW >> 1), y: Yd - 17 - o.MH }
    // left to right: the lamp, the speaker (half hidden) and the monitor
    o.lamp = { x: o.mon.x - (wide ? 21 : 16), y: Yd - 12 - Ht('lamp') }
    o.spk = { x: o.mon.x - 12, y: Yd - 12 - Ht('speaker') }
    o.tower = { x: wide ? o.mon.x + o.MW + 1 : o.mon.x + o.MW - 4, y: Yd - 9 - Ht('tower') }
    o.plants = { x: o.tower.x + 1, y: o.tower.y - Ht('plants') + 2 }
    o.cam = { x: o.tower.x + 30, y: o.tower.y - Ht('cam') + 1 }
    o.xc = o.tower.x + Wd('tower')
    if (wide) {
      o.peg = { x: o.xc + 5, w: 86, h: 70 }
      o.peg.y = Yd - 62 - o.peg.h
      o.frame = { x: o.tower.x + 6, y: Yd - 116 }
    } else if (NAR.low) {
      // the pegboard on the return's wall, right of the tower; the picture on the wall above the monitor
      o.peg = { x: o.xc + 3, w: NAR.pegW, h: 70 }
      o.peg.y = Yd - 24 - o.peg.h
      o.frame = { x: o.tower.x - 34, y: o.peg.y + 3 }
    } else {
      // last resort (very narrow screens at 1x): the pegboard up high, above the tower, and the picture to its left
      o.peg = { x: o.tower.x + 30, w: NAR.pegW, h: 70 }
      o.peg.y = Yd - 62 - o.peg.h
      o.frame = { x: o.peg.x - 35, y: Yd - 120 }
    }
    // The cabinet holds the whole homelab. On desktop: on top, the router on the switch, the Raspberry and the
    // white box; below, the UPS and the NAS (the cabinet is at least as wide as the two need together). On phones,
    // at the usual width: on top, the router and the UPS; below, the Raspberry and the NAS; no box.
    o.retEnd = Math.max(o.peg.x + o.peg.w + 2, o.xc + (wide ? 92 : 71))
    // the desk ends just past the tower (xd); the cabinet is a separate, lower piece with its own top
    // that slides under the end of the desk (in the real corner it runs along the other wall: the L, unfolded)
    o.xd = o.xc + (wide ? 5 : 3)
    o.cab = { x0: o.xc, x1: o.retEnd - 3, top: Yd - 1, y0: Yd + 8, y1: o.FY + 2 }
    const by = o.cab.y1 - 3
    const ys = Math.round((o.cab.y0 + o.cab.y1) / 2)
    o.cab.ys = ys
    const roomy = o.cab.x1 - o.cab.x0 >= 89
    o.nas = { x: o.cab.x1 - 4 - Wd('nas'), y: by - Ht('nas') }
    o.sw = { x: o.cab.x0 + 7, y: ys - Ht('switch') }
    o.router = { x: o.cab.x0 + 6, y: o.sw.y - Ht('router') }
    if (roomy) {
      o.ups = { x: o.cab.x0 + 6, y: by - Ht('ups') }
      o.pi = { x: o.router.x + Wd('router') + 5, y: ys - Ht('pi') }
      const boxX = o.cab.x1 - 5 - Wd('box')
      o.box = boxX > o.pi.x + Wd('pi') + 3 ? { x: boxX, y: ys - Ht('box') } : null
    } else {
      o.ups = { x: o.cab.x1 - 4 - Wd('ups'), y: ys - Ht('ups') }
      o.pi = { x: o.cab.x0 + 6, y: by - Ht('pi') }
      o.box = null
    }
    o.showLamp = wide ? o.lamp.x + 1 >= 0 : NAR.lamp
    o.deskX0 = o.showLamp ? o.lamp.x - 3 : o.mon.x - 8
    o.seat = Yd + 22
    o.pose = { x: Jx - POSE.cx, y: o.seat - POSE.seat }
    o.kbCx = Jx - (wide ? 14 : 12)
    o.mouse = { x: Jx + 23, y: Yd - 4 - Ht('mouse') }
    // on phones, the mug stays in view; if it cannot fit without overlapping the keyboard, it is not drawn
    o.mug = { x: wide ? Jx - 60 : Math.max(1, Jx - 60), y: Yd - 1 - Ht('mug') }
    if (!wide && o.mug.x + Wd('mug') > o.kbCx - 30) o.mug = null
    // the lamp: the head (up top, facing forward) and the arm with the base
    o.lampHead = [o.lamp.x + 9, o.lamp.y, Wd('lamp') - 9, 15]
    o.lampArm = [o.lamp.x + 1, o.lamp.y + 3, 15, Ht('lamp') - 3]
    // Boxes the text must not overlap (x, y, w, h)
    o.boxes = [
      [o.mon.x, o.mon.y - 2, o.MW, o.MH + 6],
      [Jx - 16, Yd - 42, 32, 40],
      [o.tower.x, o.plants.y, Wd('tower'), Yd - o.plants.y],
      [o.frame.x, o.frame.y, Wd('frame'), Ht('frame')],
      [o.peg.x, o.peg.y, o.peg.w, o.peg.h],
      [o.deskX0, Yd - DK, o.retEnd - o.deskX0, 20],
    ]
    if (o.showLamp) o.boxes.push(o.lampHead, o.lampArm, [o.spk.x, o.spk.y, 14, 20])
    // what counts as the drawn scene (a click there, and only there, sends keyboard input to his screen)
    o.scene = [
      Math.min(o.deskX0, o.showLamp ? o.lamp.x : Infinity) - 2,
      Math.min(o.peg.y, o.frame.y, o.plants.y, o.showLamp ? o.lamp.y : Infinity) - 3,
      o.retEnd + 2,
      o.seat + 47,
    ]
    return o
  }

  // Phones: which composition fits in nw drawing pixels. Best to worst: lamp and whole return; lamp with the return
  // off the right edge (pegboard and NAS whole); the same without the lamp; the high pegboard. Returns Jx or null.
  const LEVELS = [
    { lamp: true, low: true, pi: true, full: true },
    { lamp: true, low: true, pi: true, full: false },
    { lamp: false, low: true, pi: true, full: true },
    { lamp: false, low: true, pi: true, full: false },
    { lamp: false, low: false, pi: false, full: true },
    { lamp: false, low: false, pi: false, full: false },
  ]
  function fitNarrow(nw, lv) {
    const minMW = lv.low ? 76 : 70
    for (let MW = 96; MW >= minMW; MW -= 2)
      for (let pegW = 84; pegW >= 64; pegW -= 2) {
        NAR = { MW, pegW, lamp: lv.lamp, low: lv.low, pi: lv.pi }
        const o = place(0, 200)
        const left = lv.lamp ? o.lamp.x : -32 // lamp shown: its edge is the limit; no lamp: Josu and his chair fit whole
        const right = Math.max(o.peg.x + o.peg.w, o.nas.x + Wd('nas'), lv.full ? o.retEnd + 1 : 0)
        const lo = -left
        const hi = nw - 2 - right
        if (lo > hi) continue
        // whole scene: centred; if the return runs off, flush right (only the end of the return is cut off)
        return lv.full && lv.lamp ? Math.round((lo + hi) / 2) : hi
      }
    return null
  }
  // Scale on phones: a whole number of device pixels per drawing pixel (sharp), between 1.3 and 2 CSS pixels.
  // The most complete composition wins and, within it, the largest scale.
  function pickNarrow(width) {
    const dpr = window.devicePixelRatio || 1
    const scales = []
    for (let k = Math.floor(2 * dpr + 1e-6); k >= 1 && k / dpr >= 1.3 - 1e-6; k--) scales.push(k / dpr)
    if (!scales.length) scales.push(2)
    for (const lv of LEVELS)
      for (const s of scales) {
        const nw = Math.ceil(width / s)
        const Jx = fitNarrow(nw, lv)
        if (Jx !== null) return { S: s, NW: nw, Jx }
      }
    // nothing fits fully: the largest scale and the most compact composition, flush right
    NAR = { MW: 70, pegW: 64, lamp: false, low: false, pi: false }
    const nw = Math.ceil(width / scales[0])
    return { S: scales[0], NW: nw, Jx: Math.max(32, nw - 2 - (place(0, 200).nas.x + Wd('nas'))) }
  }

  // Each text block in the name area is as wide as its longest line (if the name breaks onto two lines, its box
  // does not fill the column): the text stays selectable without covering the scene beside it.
  const textBlocks = [...who.querySelectorAll('.cmd, h1, .lede, .links')]
  function fitText() {
    const rg = document.createRange()
    for (const el of textBlocks) {
      el.style.width = ''
      rg.selectNodeContents(el)
      const left = el.getBoundingClientRect().left
      let right = left
      for (const q of rg.getClientRects()) right = Math.max(right, q.right)
      if (right > left) el.style.width = Math.ceil(right - left) + 2 + 'px'
    }
  }

  function textRects(r) {
    const out = []
    const rg = document.createRange()
    const tw = document.createTreeWalker(who, NodeFilter.SHOW_TEXT)
    while (tw.nextNode()) {
      if (!tw.currentNode.data.trim()) continue
      rg.selectNodeContents(tw.currentNode)
      for (const q of rg.getClientRects()) if (q.width) out.push([(q.left - r.left) / S, (q.top - r.top) / S, q.width / S, q.height / S])
    }
    return out
  }

  function layout() {
    const r = hero.getBoundingClientRect()
    if (!r.width) return false
    fitText()
    let nar = null
    if (r.width >= 544) {
      S = r.width >= 1100 ? 3 : 2
      NW = Math.ceil(r.width / S)
      wide = true
    } else {
      wide = false
      nar = pickNarrow(r.width)
      S = nar.S
      NW = nar.NW
    }
    const texts = textRects(r)
    const textB = Math.max(0, ...texts.map((t) => t.y + t.h)) || 0
    const hit = (o) => o.boxes.some(([x, y, w, h]) => texts.some(([a, b, c, d]) => x < a + c + 4 && a - 4 < x + w && y < b + d + 4 && b - 3 < y + h))
    let Jx
    let Yd = 132 + 8
    if (wide) {
      // On the right, against the text column (the right edge of the content); if it overlaps the name, further
      // right up to the window edge; if it still does not fit beside the text, below it.
      const right = place(0, Yd).retEnd // from Jx to the end of the cabinet
      const wr = who.getBoundingClientRect()
      const colRight = Math.floor((wr.right - r.left - parseFloat(getComputedStyle(who).paddingRight)) / S) + 12
      const maxJx = NW - 2 - right
      Jx = Math.min(maxJx, colRight - right)
      while (Jx < maxJx && hit(place(Jx, Yd))) Jx++
    } else Jx = nar.Jx // on phones, below the text, composed for the width (pickNarrow has already set NAR)
    let o = place(Jx, Yd)
    while (hit(o) && Yd < 600) o = place(Jx, ++Yd)
    Object.assign(L, o)
    // the label describes what is drawn: the narrowest compositions leave the lamp out
    canvas.setAttribute('aria-label', L.showLamp ? labelLamp : canvas.dataset.labelNoLamp)
    NH = Math.max(L.NH, Math.ceil(textB) + 10)
    const hpx = NH * S + 'px'
    if (hero.style.height !== hpx) hero.style.height = hpx
    canvas.width = NW
    canvas.height = NH
    canvas.style.width = NW * S + 'px'
    canvas.style.height = NH * S + 'px'
    const N = NW * NH
    M = new Uint8Array(N)
    MS = new Uint8Array(N)
    OWN = new Uint8Array(N)
    LT = new Uint8Array(N)
    BG = new Uint32Array(N)
    img = ctx.createImageData(NW, NH)
    F = new Uint32Array(img.data.buffer)
    // Curved screen: the ends come closer and look taller (top edge curved like a smile, bottom edge the other way).
    L.scrTop = []
    L.scrBot = []
    const half = (L.MW - 1) / 2
    for (let i = 0; i < L.MW; i++) {
      const off = Math.round(3 * ((i - half) / half) ** 2)
      L.scrTop.push(L.mon.y - off)
      L.scrBot.push(L.mon.y + L.MH - 1 + off)
    }
    // Pegboard keyboards: the top right one and the bottom one.
    slotPos()
    compose()
    placeHot()
    bgKey = ''
    lightKey = ''
    return true
  }

  function slotPos() {
    const P = L.peg
    L.slot = [
      { r: P.x + P.w - 5, y: P.y + 6 },
      { r: P.x + P.w - 4, y: P.y + 31 },
    ]
  }
  const kbAt = (i, id = slots[i].id) => ({ x: L.slot[i].r - Wd('kb_' + id) + 1, y: L.slot[i].y, w: Wd('kb_' + id), h: Ht('kb_' + id) })
  const deskAt = (id = deskKb) => ({ x: L.kbCx - (Wd('kd_' + id) >> 1), y: L.Yd - 1 - Ht('kd_' + id) })

  // ---- The static scene -----------------------------------------------------------------------------------
  function pegboard() {
    const { x, y, w, h } = L.peg
    rect(x, y, w, h, 'k')
    rect(x + 1, y + 1, w - 2, h - 2, '9')
    for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) M[cy * NW + cx] = 0
    // staggered slots (the wall shows through them)
    for (let j = 0, yy = y + 4; yy < y + h - 4; j++, yy += 5)
      for (let xx = x + 4 + (j % 2 ? 2 : 0); xx < x + w - 4; xx += 4) {
        pm(xx, yy, 'O')
        pm(xx, yy + 1, 'O')
      }
    for (const [sx, sy] of [[x + 2, y + 2], [x + w - 4, y + 2], [x + 2, y + h - 4], [x + w - 4, y + h - 4]]) rect(sx, sy, 2, 2, 'l')
    // shelf with the figurine and the mug; the clear box of keycaps and switches
    blit('shelf', x + 4, y + h - 19)
    const bx = x + w - 35
    const by = y + h - 13
    blit('kbox', bx, by)
    const R = rng(11)
    const KC = ['w', '2', 'K', 'Y', 'L', '4', 'w']
    for (let yy = by + 4; yy < by + 8; yy++)
      for (let xx = bx + 2; xx < bx + Wd('kbox') - 2; xx++) {
        if (xx === bx + (Wd('kbox') >> 1)) continue
        if (yy > by + 5 || R() < 0.55) pm(xx, yy, KC[Math.floor(R() * KC.length)])
      }
  }

  function monitor() {
    const { x } = L.mon
    for (let i = 0; i < L.MW; i++) {
      const t = L.scrTop[i]
      const b = L.scrBot[i]
      for (let y = t; y <= b; y++) {
        let m = 'b'
        if (y === t || y === b || i === 0 || i === L.MW - 1) m = 'k'
        else if (y <= t + 1 || y >= b - 2 || i <= 1 || i >= L.MW - 2) m = 'x'
        pm(x + i, y, m)
      }
      if (i === 1 || i === L.MW - 2) for (let y = t + 1; y < b; y++) pm(x + i, y, 'r')
    }
    // stand (behind him, barely visible)
    const cx = x + (L.MW >> 1)
    for (let y = L.scrBot[L.MW >> 1] + 1; y < L.Yd - 10; y++) {
      pm(cx - 3, y, 'k')
      pm(cx - 2, y, 'r')
      pm(cx - 1, y, 'L')
      pm(cx, y, 'r')
      pm(cx + 1, y, 'k')
    }
  }

  function desk() {
    const { Yd, deskX0, xd } = L
    // the main desk top ends at xd, just past the tower; the low cabinet goes to its right (cabinetTop)
    rect(deskX0, Yd - DK, xd - deskX0, DK, 'd')
    for (let x = deskX0; x < xd; x++) pm(x, Yd - DK, 'D')
    // desk mat with grey triangle facets and the light stripe
    const mx0 = L.Jx - 54
    const mx1 = L.Jx + 40
    const R = rng(3)
    const tris = []
    for (let i = 0; i < 9; i++) tris.push([mx0 + R() * (mx1 - mx0), R() < 0.5 ? 1 : -1, 6 + R() * 10])
    for (let y = Yd - 12; y < Yd - 1; y++)
      for (let x = mx0; x <= mx1; x++) {
        const edge = y === Yd - 12 || y === Yd - 2 || x === mx0 || x === mx1
        let m = 'm'
        for (const [tx, s, tw] of tris) if (Math.abs(x - tx - s * (y - Yd) * 0.9) < tw * ((y - (Yd - 12)) / 11)) m = m === 'm' ? 'M' : 'm'
        if (Math.abs(x - (mx0 + 18) + (y - Yd) * 2.2) < 1.2 && x > mx0 + 2) m = 't'
        pm(x, y, edge ? 'k' : m)
      }
    // front edge
    for (let x = deskX0; x < xd; x++) {
      pm(x, Yd, 'k')
      pm(x, Yd + 1, 'D')
      pm(x, Yd + 2, 'q')
      pm(x, Yd + 3, 'k')
    }
    for (let y = Yd - DK; y < Yd + 4; y++) {
      pm(deskX0 - 1, y, 'k')
      pm(xd, y, 'k')
    }
    // panel leg on the left and the corner leg
    for (let y = Yd + 4; y < L.FY; y++) {
      pm(deskX0, y, 'k')
      pm(deskX0 + 1, y, 'D')
      pm(deskX0 + 2, y, 'D')
      pm(deskX0 + 3, y, 'q')
      pm(deskX0 + 4, y, 'k')
    }
    for (let y = Yd + 4; y < L.B + 1; y++) {
      pm(L.xc - 3, y, 'k')
      pm(L.xc - 2, y, 'r')
      pm(L.xc - 1, y, 'k')
    }
  }

  // The top of the low cabinet, lower than the desk. It is painted before the desk: its left part sits under
  // the end of the desk, which casts its shadow on it (what shows below the edge and a strip next to the end).
  function cabinetTop() {
    const { x0, x1, top, y0 } = L.cab
    const { Yd, xd } = L
    rect(x0, top, x1 - x0 + 1, y0 - top - 3, 'd')
    for (let x = x0; x <= x1; x++) {
      pm(x, top, 'D')
      pm(x, y0 - 3, 'k')
      pm(x, y0 - 2, 'D')
      pm(x, y0 - 1, 'q')
    }
    for (let y = top; y < y0; y++) pm(x1 + 1, y, 'k')
    for (let x = x0; x <= xd + 1; x++) for (let y = Yd + 4; y < y0 - 3; y++) pm(x, y, 'q')
    for (let y = top + 1; y < y0 - 3; y++) {
      pm(xd + 1, y, 'q')
      pm(xd + 2, y, 'D')
    }
  }
  function cabinetLoose() {
    const { x0, x1, top } = L.cab
    blit('papers', x0 + 16, top + 2)
    blit('bottle', x1 - 14, top + 5 - Ht('bottle'))
  }

  // Open cabinet: on the shelf, the router on the switch, the Raspberry and the white box; below, the UPS and the NAS.
  function cabinet() {
    const { x0, x1, y0, y1 } = L.cab
    rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'k')
    rect(x0 + 1, y0, x1 - x0 - 1, y1 - y0, 'D')
    rect(x0 + 4, y0 + 1, x1 - x0 - 7, y1 - y0 - 4, 'c')
    const ys = Math.round((y0 + y1) / 2)
    rect(x0 + 4, ys, x1 - x0 - 7, 2, 'D')
    rect(x0 + 4, ys + 2, x1 - x0 - 7, 1, 'q')
    rect(x0 + 4, y0 + 1, x1 - x0 - 7, 1, 'q')
    for (let y = y0; y < y1; y++) pm(x0 + 3, y, 'q')
    rect(x0, y1 - 2, x1 - x0 + 1, 1, 'q')
    for (const [xx, yy] of [[x0 + 6, y0 + 5], [x1 - 6, y0 + 5], [x0 + 6, ys + 6], [x1 - 6, ys + 6]]) pm(xx, yy, 'r')
    if (L.box) blit('box', L.box.x, L.box.y)
    const roomy = L.ups.y > L.cab.ys
    if (roomy) cable(L.router.x + Wd('router') - 1, L.router.y + 7, L.pi.x, L.pi.y + 3, 2)
    else cable(L.router.x + Wd('router') - 1, L.router.y + 7, L.ups.x, L.ups.y + 5, 2)
    blit('switch', L.sw.x, L.sw.y)
    blit('router', L.router.x, L.router.y)
    blit('pi', L.pi.x, L.pi.y)
    if (roomy) cable(L.ups.x + Wd('ups') - 1, L.ups.y + 4, L.nas.x, L.nas.y + 12, 2)
    else cable(L.pi.x + Wd('pi'), L.pi.y + 3, L.nas.x, L.nas.y + 12, 2)
    blit('ups', L.ups.x, L.ups.y)
    blit('nas', L.nas.x, L.nas.y)
  }

  function compose() {
    M.fill(0)
    blit('frame', L.frame.x, L.frame.y)
    pegboard()
    cabinetTop()
    desk()
    if (L.showLamp) {
      blit('speaker', L.spk.x, L.spk.y)
      blit('lamp', L.lamp.x, L.lamp.y)
    }
    blit('plantS', L.mon.x + L.MW - 24, L.Yd - 12 - Ht('plantS'))
    blit('plantS2', L.mon.x + L.MW - 13, L.Yd - 11 - Ht('plantS2'))
    monitor()
    // webcam cable behind the tower
    cable(L.cam.x + 5, L.cam.y + 5, L.xc + 1, L.Yd - 12, 2)
    blit('tower', L.tower.x, L.tower.y)
    blit('plants', L.plants.x, L.plants.y)
    blit('cam', L.cam.x, L.cam.y)
    if (L.mug) blit('mug', L.mug.x, L.mug.y)
    blit('mouse', L.mouse.x, L.mouse.y)
    cabinetLoose()
    cabinet()
    MS.set(M)
  }

  // ---- Palettes -----------------------------------------------------------------------------------------
  const LUTS = {}
  function lut(th) {
    if (LUTS[th]) return LUTS[th]
    const P = PAL[th]
    const col = {}
    for (const [k, v] of Object.entries(P.colors)) col[k] = u32(v)
    const layers = ['base', 'lamp2', 'lamp', 'screen', 'face'].map((ly) => {
      const t = new Uint32Array(NMAT)
      for (const ch of MAT) {
        if ('#%@'.includes(ch)) continue
        const nm = (ly !== 'base' && P[ly] && P[ly][ch]) || P.base[ch]
        t[C[ch]] = col[nm]
      }
      return t
    })
    const rim = (P.rim || [null, null, null]).map((n) => (n ? col[n] : 0))
    const W = {}
    for (const [k, v] of Object.entries(P.wall)) W[k] = col[v]
    return (LUTS[th] = {
      col,
      layers,
      rim,
      W,
      rgb: P.rgb.map((n) => col[n]),
      dim: (P.rgbDim || []).map((n) => col[n]),
      off: col[P.rgbOff],
      back: [col[P.back], col[P.back2 || P.back]],
      led: [col[P.ledOn], col[P.ledOn2], col[P.ledOff]],
      glowK: P.glowK ? col[P.glowK] : 0,
      lampOn: th === 'light' ? col.lampOn : col.amber || col.ice,
    })
  }

  // ---- Background: wall, corner, shadow under the desk, skirting board and carpet ---------------------------
  function paintBg(th) {
    const T = lut(th)
    const W = T.W
    const { B, xc, Yd, deskX0 } = L
    // The room continues under the name: the wall is the page and the floor runs from side to side.
    const fade = () => 1
    const g0 = B - 16
    for (let y = 0; y < B; y++)
      for (let x = 0; x < NW; x++) {
        const t = y < g0 ? 0 : Math.min(1, (y - g0) / 16) * fade(x)
        BG[y * NW + x] = dith(x, y, t) ? W.low : W.top
      }
    // the corner: a soft edge that fades out towards the top
    const cy0 = L.plants.y - 6
    for (let y = Math.max(0, cy0); y < B; y++) if (dith(xc, y, Math.min(1, (y - cy0) / 10))) BG[y * NW + xc] = W.low
    // shadows on the wall, below and right of the picture, the pegboard, the monitor and the tower (only the
    // strip the object does not cover), so they do not look pasted on
    const wallShadow = (x, y, w, h, maxY = B) => {
      for (let yy = y + 2; yy < Math.min(y + h + 3, maxY); yy++)
        for (let xx = x + 2; xx < x + w + 3; xx++) {
          if (xx < 0 || xx >= NW || yy < 0) continue
          if (xx < x + w && yy < y + h) continue
          const edge = xx >= x + w + 2 || yy >= y + h + 2
          if (dith(xx, yy, edge ? 0.3 : 0.7)) BG[yy * NW + xx] = W.under
        }
    }
    wallShadow(L.frame.x, L.frame.y, Wd('frame'), Ht('frame'))
    wallShadow(L.peg.x, L.peg.y, L.peg.w, L.peg.h)
    wallShadow(L.tower.x, L.tower.y, Wd('tower'), Ht('tower'), Yd - DK)
    wallShadow(L.mon.x, L.mon.y - 3, L.MW, L.MH + 6, Yd - DK)
    // shadow under the desk
    for (let y = Yd + 4; y < B; y++)
      for (let x = Math.max(0, deskX0); x < Math.min(NW, L.retEnd); x++) {
        const t = 1 - Math.max(0, (y - (B - 8)) / 8)
        if (dith(x, y, t)) BG[y * NW + x] = W.under
      }
    // skirting board
    for (let x = 0; x < NW; x++) {
      if (!dith(x, B - 2, fade(x))) continue
      BG[(B - 2) * NW + x] = W.base
      BG[(B - 1) * NW + x] = W.base
    }
    // carpet (ribbed: alternating rows)
    for (let y = B; y < NH; y++)
      for (let x = 0; x < NW; x++) {
        if (!dith(x, y, fade(x))) {
          BG[y * NW + x] = W.top
          continue
        }
        BG[y * NW + x] = (y - B) % 2 === 1 && (x + y) % 3 !== 0 && fade(x) >= 1 ? W.floor2 : W.floor
      }
    // contact shadows
    const feet = [[deskX0, 6, L.FY], [L.cab.x0, L.cab.x1 - L.cab.x0, L.cab.y1 + 1], [L.Jx - 26, 52, L.seat + 42]]
    for (const [x0, w, y] of feet)
      for (let i = 0; i < 2; i++) for (let x = x0 - 1 - i; x < x0 + w + 1 - i; x++) if (x >= 0 && x < NW && y + i < NH && y + i >= B) BG[(y + i) * NW + x] = W.shade
    // by day, the lamp, when on, leaves a warm haze under its head
    if (th === 'light' && lampOn[th] && L.showLamp)
      for (let y = L.lamp.y + 8; y < L.Yd - 16; y++)
        for (let x = L.lamp.x + 6; x < L.lamp.x + 44; x++) {
          const t = 1 - (y - L.lamp.y - 8) / (L.Yd - 16 - L.lamp.y - 8)
          if (x >= 0 && x < NW && dith(x, y, t * 0.45 * (1 - Math.abs(x - L.lamp.x - 24) / 20))) BG[y * NW + x] = T.col.glow
        }
    // at night: the light of the screen and the tower reaches the whole corner (the pegboard and the picture do not
    // go black), the screen's halo on the wall and, when it is on, the lamp's cone
    if (th !== 'light') {
      const cx = L.mon.x + L.MW / 2
      const cy = L.mon.y + L.MH / 2
      if (W.amb1) {
        const px = L.peg.x + L.peg.w / 2
        const py = L.peg.y + L.peg.h / 2
        const ax = (cx + px) / 2
        const ay = (cy + py) / 2
        const rx = Math.abs(px - cx) / 2 + L.peg.w / 2 + 34
        const ry = Math.max(Math.abs(py - cy) / 2 + L.peg.h / 2 + 30, L.MH + 40)
        halo(ax, ay, rx, ry, W.amb1, B - 2, 14)
        halo(ax, ay, rx * 0.78, ry * 0.8, W.amb2, B - 2, 14)
      }
      halo(cx, cy, L.MW / 2 + 16, L.MH / 2 + 15, W.halo, B - 2)
      halo(cx, cy, L.MW / 2 + 6, L.MH / 2 + 6, W.halo2, B - 2)
      if (lampOn[th] && L.showLamp && W.lampHalo) lampCone(W.lampHalo, W.lampHalo2)
    }
  }
  // The lamp's light falls from the strip under its head down to the desk, widening.
  const STRIP = (() => {
    const s = SPR.lamp
    const out = []
    for (let i = 0; i < s.w; i++) for (let j = s.h - 1; j >= 0; j--) if (s.a[j * s.w + i] === C.y) { out.push([i, j]); break }
    return out
  })()
  function lampCone(c1, c2) {
    if (!STRIP.length) return
    const bot = L.Yd - DK
    const x0 = L.lamp.x + STRIP[0][0]
    const x1 = L.lamp.x + STRIP[STRIP.length - 1][0]
    const top = L.lamp.y + Math.min(...STRIP.map((s) => s[1])) + 1
    const yAt = (x) => L.lamp.y + (STRIP.find((s) => L.lamp.x + s[0] >= x) || STRIP[STRIP.length - 1])[1]
    for (let y = top; y < bot; y++) {
      const f = (y - top) / (bot - top)
      const sp = (y - top) * 0.42
      const l = x0 - sp
      const r = x1 + sp
      const mid = (l + r) / 2
      for (let x = Math.max(0, Math.floor(l) - 1); x <= Math.min(NW - 1, Math.ceil(r) + 1); x++) {
        if (x >= x0 && x <= x1 && y <= yAt(x)) continue
        const i = y * NW + x
        const t = 1 - Math.abs(x - mid) / ((r - l) / 2 + 1)
        const near = x >= x0 && x <= x1 && y - yAt(x) <= 3
        if (t <= 0 || !dith(x, y, near ? 0.85 - (y - yAt(x)) * 0.12 : Math.min(1, t * 1.6) * (0.7 - f * 0.55))) continue
        BG[i] = near ? c2 : c1
      }
    }
  }
  // topFade: rows over which the halo fades out against the top edge (so it is not cut off sharply under the header)
  function halo(cx, cy, rx, ry, color, maxY, topFade = 0) {
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(maxY - 1, cy + ry); y++)
      for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(NW - 1, cx + rx); x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
        const k = topFade ? Math.min(1, y / topFade) : 1
        if ((d < 0.75 && k >= 1) || (d < 1 && dith(x, y, Math.min(1, (1 - d) / 0.25) * k))) BG[y * NW + x] = color
      }
  }

  // ---- Light: the screen on the desk and the lamp (its pool), per theme ------------------------------------
  function makeLight(th) {
    LT.fill(0)
    const P = PAL[th]
    const ell = (cx, cy, rx, ry, band, v, keep) => {
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(NH - 1, cy + ry); y++)
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(NW - 1, cx + rx); x++) {
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
          if (d >= 1) continue
          const i = y * NW + x
          if (keep && LT[i] >= v) continue
          if (d < 1 - band || dith(x, y, (1 - d) / band)) LT[i] = v
        }
    }
    if (P.screen) ell(L.mon.x + L.MW / 2, L.Yd - 8, L.MW / 2 + 4, 12, 0.25, 3)
    if (lampOn[th] && P.lamp && L.showLamp) {
      const bx = L.lamp.x + 24
      const by = L.lamp.y + 11
      const cy = L.Yd - 6
      ell(bx, cy, 38, 14, 0.3, 1)
      ell(bx, cy, 26, 9, 0.25, 2)
      for (let y = by; y < cy; y++) {
        const hw = 14 + ((y - by) / (cy - by)) * 12
        for (let x = Math.floor(bx - hw - 3); x <= bx + hw + 3; x++) {
          if (x < 0 || x >= NW) continue
          const t = 1 - Math.abs(x - bx) / hw
          const i = y * NW + x
          if (t > 0.1) LT[i] = Math.max(LT[i] === 3 ? 0 : LT[i], 2)
          else if (t > -0.25 && dith(x, y, (t + 0.25) / 0.35) && LT[i] < 1) LT[i] = 1
        }
      }
    }
  }

  // ---- RGB, backlight and LEDs ---------------------------------------------------------------------------
  function rgbAt(T, x, y) {
    const mode = RGBM[rgbMode[theme()]]
    if (mode === 'off') return T.off
    const n = T.rgb.length
    if (mode === 'wave') return T.rgb[(((Math.floor((x * 0.7 + y) / 3 - tick * 0.25) % n) + n) % n)]
    if (mode === 'static') return T.rgb[rgbHue % n]
    const b = reduced ? 1 : (Math.sin(tick / 9) + 1) / 2
    return dith(x, y, b) ? T.rgb[rgbHue % n] : T.off
  }
  // the tower's dominant colour (to tint the wall)
  function rgbIndex(T) {
    const mode = RGBM[rgbMode[theme()]]
    const n = T.rgb.length
    if (mode === 'wave') return (((Math.floor((L.tower.x * 0.7 + L.tower.y + 30) / 3 - tick * 0.25) % n) + n) % n)
    return rgbHue % n
  }
  function ledOn(x, y) {
    if (reduced) return (x * 3 + y) % 5 !== 0
    const h = ((x * 73856093) ^ (y * 19349663)) >>> 0
    const sp = labBurst > 0 ? 1.3 : 3 + (h % 7)
    return Math.sin(tick / sp + (h % 100)) > (labBurst > 0 ? -0.1 : -0.55)
  }

  // ---- The screen: tab bar, file tree, abstract code and the terminal with the _ cursor ----------------------
  const code = { lines: [], cur: 4, rev: 6 }
  const codeR = rng(42)
  function codeLine() {
    const ind = [0, 2, 2, 4, 4, 6][Math.floor(codeR() * 6)]
    const segs = []
    let len = ind
    const max = 10 + Math.floor(codeR() * 22)
    while (len < max) {
      const l = 2 + Math.floor(codeR() * 6)
      const k = codeR()
      segs.push([l, k < 0.4 ? 'a' : k < 0.58 ? 'p' : k < 0.72 ? 'f' : k < 0.86 ? 'o' : 'G'])
      len += l + 1
    }
    return { ind, segs, len }
  }
  for (let i = 0; i < 14; i++) code.lines.push(codeLine())
  const tree = []
  {
    const R = rng(9)
    for (let i = 0; i < 14; i++) tree.push([[0, 1, 1, 2, 2, 2][Math.floor(R() * 6)], 3 + Math.floor(R() * 8)])
  }
  const term = { hist: [], input: '' }
  let userTyping = 0
  function typeStep() {
    code.rev++
    const ln = code.lines[code.cur]
    if (code.rev > ln.len) {
      code.cur++
      code.rev = 0
      if (code.cur >= code.lines.length) {
        code.lines.shift()
        code.lines.push(codeLine())
        code.cur = code.lines.length - 1
      }
    }
  }
  function sp(i, r, m) {
    if (i < 1 || i >= L.MW - 1) return
    const y = L.scrTop[i] + 2 + r
    if (y > L.scrBot[i] - 3) return
    pm(L.mon.x + i, y, m)
  }
  // each letter drawn whole at the height of its first column: the line follows the curve, the letter does not skew
  function glyph(ch, i, r, m) {
    const f = FONT[ch]
    if (!f || i < 1) return
    const y0 = L.scrTop[i] + 2 + r
    for (let k = 0; k < 15; k++) {
      const X = i + (k % 3)
      const Y = y0 + Math.floor(k / 3)
      if (f[k] === '1' && X < L.MW - 2 && Y <= L.scrBot[X] - 3) pm(L.mon.x + X, Y, m)
    }
  }
  function drawScreen() {
    const MW = L.MW
    const s1 = Math.round(MW * 0.22)
    const s2 = Math.round(MW * 0.63)
    // tabs
    for (let i = 3; i < MW - 3; i++) if (i % 19 > 2 && i % 19 < 13) sp(i, 1, i < 22 ? 'f' : 'A')
    for (let i = 2; i < MW - 2; i++) sp(i, 3, 'A')
    for (let r = 4; r < 40; r++) {
      sp(s1, r, 'A')
      sp(s2, r, 'A')
    }
    // file tree
    tree.forEach(([ind, len], k) => {
      for (let j = 0; j < len; j++) sp(3 + ind * 2 + j, 6 + k * 2, k === 3 ? 'f' : 'A')
    })
    // editor: abstract code, the current line being typed
    const first = Math.max(0, code.cur - 11)
    for (let k = 0; k < 12; k++) {
      const li = first + k
      const ln = code.lines[li]
      if (!ln) break
      const r = 6 + k * 2
      sp(s1 + 2, r, 'A')
      let x = s1 + 5 + ln.ind
      let shown = li < code.cur ? Infinity : li === code.cur ? code.rev : 0
      for (const [l, m] of ln.segs) {
        for (let j = 0; j < l && shown > 0 && x < s2 - 2; j++, shown--) sp(x++, r, m)
        x++
        shown--
      }
      if (li === code.cur && Math.floor(tick / 6) % 2 === 0) sp(Math.min(s2 - 2, x), r, 'a')
    }
    // terminal: history and the prompt with the _ cursor
    const tx = s2 + 3
    const room = Math.floor((MW - 3 - tx) / 4)
    const rows = L.scrBot[s2 + 4] - L.scrTop[s2 + 4] - 4
    const promptR = rows - 6
    let r = promptR - 7
    for (let k = term.hist.length - 1; k >= 0 && r >= 5; k--, r -= 7) {
      const h = term.hist[k]
      if (typeof h === 'number') for (let j = 0; j < h; j++) sp(tx + j, r + 2, 'A')
      else {
        glyph('$', tx, r, 'A')
        ;[...h.slice(0, room - 2)].forEach((ch, j) => glyph(ch, tx + 8 + j * 4, r, 'A'))
      }
    }
    glyph('$', tx, promptR, 'G')
    const vis = term.input.slice(-(room - 3))
    ;[...vis].forEach((ch, j) => glyph(ch, tx + 8 + j * 4, promptR, 'a'))
    // with keyboard focus: the terminal panel is outlined and, when empty, shows "type"
    if (typingOn) {
      for (let i = s2; i < MW - 2; i++) {
        sp(i, 3, 'f')
        sp(i, L.scrBot[i] - L.scrTop[i] - 5, 'f')
      }
      for (let r = 3; r < 40; r++) {
        sp(s2, r, 'f')
        sp(MW - 3, r, 'f')
      }
      if (!vis && room >= 6) [...'type'].forEach((ch, j) => glyph(ch, tx + 8 + j * 4, promptR, 'A'))
    }
    if (reduced || Math.floor(tick / 12) % 2 === 0 || userTyping > 0 || (typingOn && Math.floor(tick / 6) % 2 === 0)) glyph('_', tx + 8 + vis.length * 4, promptR, 'a')
  }

  // ---- Keyboards ----------------------------------------------------------------------------------------
  function hooks(x, y, w, h) {
    for (const hx of [x + Math.round(w * 0.2), x + Math.round(w * 0.74)]) {
      pm(hx - 1, y + h, 'k')
      pm(hx, y + h, 'w')
      pm(hx + 1, y + h, 'W')
      pm(hx + 2, y + h, 'k')
      pm(hx - 1, y + h + 1, 'k')
      pm(hx, y + h + 1, 'w')
      pm(hx + 1, y + h + 1, 'W')
      pm(hx + 2, y + h + 1, 'k')
      for (let i = -1; i < 3; i++) pm(hx + i, y + h + 2, 'k')
    }
  }
  function drawKeyboards() {
    slots.forEach((s, i) => {
      if (!s.id || (flight && (flight.to === i || flight.from === i))) {
        const a = kbAt(i, 'tklB')
        hooks(a.x + 8, a.y, a.w - 16, a.h)
        return
      }
      const a = kbAt(i)
      blit('kb_' + s.id, a.x, a.y)
      hooks(a.x, a.y, a.w, a.h)
    })
    if (deskKb && !flight) {
      const d = deskAt()
      blit('kd_' + deskKb, d.x, d.y)
    }
  }
  // The desk keyboard goes up first and the pegboard one comes down after. Both fly in front of and above the picture,
  // the plants and the tower (never through them), with their shadow on the wall; the one going up takes a higher arc.
  const shadows = []
  function arcPath(a, b, w, h, extra) {
    const obst = [
      [L.frame.x, L.frame.y, Wd('frame'), Ht('frame')],
      [L.plants.x, L.plants.y, Wd('plants'), Ht('plants')],
      [L.tower.x, L.tower.y, Wd('tower'), Ht('tower')],
      [L.cam.x, L.cam.y, Wd('cam'), Ht('cam')],
    ]
    const at = (c, t) => {
      const u = 1 - t
      return [u * u * u * a[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * t * (u + t) * c + t * t * t * b[1]]
    }
    const hits = (c) => {
      let n = 0
      for (let k = 1; k < 24; k++) {
        const [x, y] = at(c, k / 24)
        for (const [ox, oy, ow, oh] of obst) if (x < ox + ow && ox < x + w && y < oy + oh && oy < y + h) n++
      }
      return n
    }
    // without leaving the band of the scene (never over the name or outside the drawing): the highest point of the
    // curve (t = 0.5) does not rise above the top of the scene. If that leaves no way around them (on phones there is
    // no room), it passes in front with its shadow.
    const top = Math.max(0, L.scene[1])
    const ceil = (top - (a[1] + b[1]) / 8) / 0.75
    let best = Math.min(a[1], b[1]) - 10
    let bestN = Infinity
    for (let c = Math.min(a[1], b[1]) - 10; c >= ceil; c -= 2) {
      const n = hits(c)
      if (n < bestN) {
        best = c
        bestN = n
      }
      if (!n) break
    }
    return (t) => at(Math.max(ceil, best - extra), t)
  }
  function flyKb(n, x, y) {
    blit('kb_' + n, x, y, 3)
    shadows.push([n, x + 2, y + 3])
  }
  function drawFlight() {
    shadows.length = 0
    if (!flight) return
    const T = flight.t / flight.n
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
    const tu = Math.min(1, T / 0.62)
    const td = Math.max(0, (T - 0.38) / 0.62)
    const up = kbAt(flight.from, flight.up)
    const d0 = deskAt(flight.up)
    if (tu < 1) {
      const [x, y] = arcPath([d0.x, d0.y - 4], [up.x, up.y], up.w, up.h, 6)(ease(tu))
      flyKb(flight.up, Math.round(x), Math.round(y))
    } else blit('kb_' + flight.up, up.x, up.y)
    const a = kbAt(flight.from, flight.down)
    const dn = deskAt(flight.down)
    if (td > 0) {
      const [x, y] = arcPath([a.x, a.y], [dn.x, dn.y - 4], a.w, a.h, 0)(ease(td))
      flyKb(flight.down, Math.round(x), Math.round(y))
    } else blit('kb_' + flight.down, a.x, a.y)
  }
  // shadow: half a tone darker on what is behind (wall, picture, tower), never on Josu or on the keyboard
  function castShadows() {
    for (const [n, X, Y] of shadows) {
      const s = SPR['kb_' + n]
      for (let j = 0; j < s.h; j++) {
        const y = Y + j
        if (y < 0 || y >= NH) continue
        for (let i = 0; i < s.w; i++) {
          const x = X + i
          if (!s.a[j * s.w + i] || x < 0 || x >= NW) continue
          const k = y * NW + x
          if (OWN[k] || !dith(x, y, 0.75)) continue
          F[k] = (0xff000000 | ((F[k] >>> 1) & 0x7f7f7f)) >>> 0
        }
      }
    }
  }

  // ---- Josu -------------------------------------------------------------------------------------------------
  function drawJosu() {
    const p = POSES[poseIdx]
    const { x, y } = L.pose
    const seat = L.seat
    // gas cylinder and base (the base does not turn: the seat does)
    for (let yy = seat + 8; yy < seat + 27; yy++) {
      pm(L.Jx - 2, yy, 'k')
      pm(L.Jx - 1, yy, 'l')
      pm(L.Jx, yy, 'L')
      pm(L.Jx + 1, yy, 'r')
      pm(L.Jx + 2, yy, 'k')
    }
    const name = p === 'B' ? (typingFrame ? 'poseB1' : 'poseB0') : p === 'P' ? 'poseP' : 'poseF'
    if (p === 'B') {
      blit(name, x, y, 1)
      blit('base0', x, seat + 25, 2)
    } else {
      blit('base0', x, seat + 25, 2)
      blit(name, x, y, 1)
    }
    if (p === 'F') faceDetails(x, y)
  }
  // Facing you: he blinks, follows the pointer with his eyes and raises his eyebrows just after turning.
  function faceDetails(x, y) {
    const blink = !reduced && nextBlink - tick < 3 && nextBlink - tick >= 0
    let look = 0
    if (pointer) {
      const dx = pointer.x - L.Jx
      const dy = pointer.y - (L.Yd - 25)
      look = dx < -30 ? -1 : dx > 30 ? 1 : 0
      if (Math.abs(dx) < 30 && dy > 40) look = 0
    }
    for (const ex of POSE.eyes) {
      const X = x + ex
      const Y = y + POSE.eyeY
      const pat = blink ? ['ssss', 'kkkk', 'ssss'] : look < 0 ? ['kkkk', 'eeEE', 'eess'] : look > 0 ? ['kkkk', 'EEee', 'ssee'] : ['kkkk', 'EeeE', 'sees']
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) pm(X + c, Y + r, pat[r][c])
    }
    // eyebrows up for a moment after turning ("yes?")
    if (frontAt >= 0 && tick - frontAt < 14 && !reduced) {
      const hx = x + POSE.cx - 14
      for (const [c0, c1] of POSE.brows)
        for (let c = c0; c <= c1; c++) {
          pm(hx + c, y + POSE.browY - 1, 'h')
          pm(hx + c, y + POSE.browY + 1, 's')
        }
    }
  }

  // ---- Frame ------------------------------------------------------------------------------------------------
  function draw() {
    if (dead) return
    if (!img) return
    const th = theme()
    const T = lut(th)
    const key = th + NW + 'x' + NH + lampOn[th] + L.Jx + ',' + L.Yd
    if (bgKey !== key) {
      paintBg(th)
      bgKey = key
    }
    if (lightKey !== key) {
      makeLight(th)
      lightKey = key
    }
    F.set(BG)
    M.set(MS)
    OWN.fill(0)
    drawScreen()
    drawKeyboards()
    drawFlight()
    drawJosu()
    const lay = T.layers
    const facing = POSES[poseIdx] !== 'B'
    const [rl, rr, rt] = T.rim
    const K = C.k
    const RG = C['#']
    const BL = C['%']
    const LED = C['@']
    const Y = C.y
    const night = th !== 'light'
    const back = T.back
    const lampC = lampOn[th] ? T.lampOn : lay[0][Y]
    for (let y = 0; y < NH; y++) {
      const row = y * NW
      for (let x = 0; x < NW; x++) {
        const i = row + x
        const m = M[i]
        if (!m) continue
        if (m === RG) F[i] = rgbAt(T, x, y)
        else if (m === BL) F[i] = back[(x >> 2) & 1]
        else if (m === LED) F[i] = ledOn(x, y) ? T.led[(x + y) % 3 === 0 ? 1 : 0] : T.led[2]
        else if (m === Y) F[i] = lampC
        else {
          const o = OWN[i]
          if (o === 1 && m === K && night) {
            if (rl && x > 0 && !OWN[i - 1]) {
              F[i] = rl
              continue
            }
            if (rr && x < NW - 1 && !OWN[i + 1]) {
              F[i] = rr
              continue
            }
            if (rt && y > 0 && !OWN[i - NW]) {
              F[i] = rt
              continue
            }
          }
          // Josu (his back to the lamp) gets none of its light: only the screen's, or the face light when he turns
          F[i] = lay[o === 1 ? (facing && night ? 4 : LT[i] === 3 ? 3 : 0) : LT[i]][m]
        }
      }
    }
    // the RGB tints the wall around the tower; the black keyboard tints the desk mat
    if (night && RGBM[rgbMode[th]] !== 'off' && T.dim.length) {
      const c = T.dim[rgbIndex(T)]
      const breath = RGBM[rgbMode[th]] === 'breath' && !reduced ? (Math.sin(tick / 9) + 1) / 2 : 1
      const cx = L.tower.x + 18
      const cy = L.tower.y + 24
      for (let y = Math.max(0, cy - 40); y < Math.min(L.B - 2, cy + 34); y++)
        for (let x = Math.max(0, cx - 44); x < Math.min(NW, cx + 46); x++) {
          const i = y * NW + x
          if (M[i] && M[i] !== HOLE) continue
          const d = Math.hypot((x - cx) / 44, (y - cy) / 38)
          if (d < 1 && dith(x, y, Math.min(1, (1 - d) * 1.6) * breath)) F[i] = c
        }
    }
    if (night && deskKb === 'tklK' && !flight && T.glowK) {
      const d = deskAt()
      const cx = d.x + Wd('kd_tklK') / 2
      const mm = [C.m, C.M, C.t, C.d]
      for (let y = L.Yd - 16; y < L.Yd; y++)
        for (let x = d.x - 8; x < d.x + Wd('kd_tklK') + 8; x++) {
          const i = y * NW + x
          if (x < 0 || x >= NW || !mm.includes(M[i])) continue
          const dd = Math.abs(x - cx) / (Wd('kd_tklK') / 2 + 8)
          if (dd < 1 && dith(x, y, (1 - dd) * 0.7)) F[i] = T.glowK
        }
    }
    castShadows()
    ctx.putImageData(img, 0, 0)
  }

  // ---- What moves ---------------------------------------------------------------------------------------
  function step() {
    tick++
    if (labBurst > 0) labBurst--
    if (userTyping > 0 && --userTyping === 0) setTyping(false)
    if (tick > nextBlink) nextBlink = tick + 60 + Math.floor(Math.random() * 110)
    // the chair swivel
    if (poseIdx !== target) {
      if (++stepT >= 3) {
        stepT = 0
        poseIdx += Math.sign(target - poseIdx)
        if (poseIdx === 2) frontAt = tick
      }
    } else if (poseIdx === 2 && !pointedAt && tick > holdTo) target = 0
    // keyboards in flight
    if (flight && ++flight.t >= flight.n) land()
    // Josu types in bursts (only with his back turned)
    if (poseIdx === 0 && !flight) {
      if (burst > 0) {
        burst--
        typingFrame = Math.floor(tick / 2) % 3 === 0 ? 1 : 0
        if (typingFrame) typeStep()
        if (!burst) {
          pause = 30 + Math.floor(Math.random() * 90)
          if (Math.random() < 0.35) {
            term.hist.push(6 + Math.floor(Math.random() * 18))
            if (term.hist.length > 4) term.hist.shift()
          }
        }
      } else {
        typingFrame = 0
        if (--pause <= 0) burst = 30 + Math.floor(Math.random() * 70)
      }
    } else typingFrame = 0
  }

  function turnToYou(hold = 70) {
    target = 2
    holdTo = Math.max(holdTo, tick + hold)
    if (reduced) {
      poseIdx = 2
      frontAt = -1
      draw()
      clearTimeout(turnToYou.t)
      turnToYou.t = setTimeout(() => {
        if (!pointedAt) {
          poseIdx = target = 0
          draw()
        }
      }, hold * 42)
    }
  }

  function swap(i) {
    const s = slots[i]
    if (flight || !s.id) return
    flight = { from: i, to: i, down: s.id, up: deskKb, t: 0, n: reduced ? 1 : 28 }
    burst = 0
    if (reduced) land()
  }
  function land() {
    const f = flight
    slots[f.from].id = f.up
    deskKb = f.down
    flight = null
    placeHot()
    if (!reduced) {
      burst = 24 // he tries it out
      pause = 0
    }
    draw()
  }

  function cycleRgb() {
    const th = theme()
    rgbMode[th] = (rgbMode[th] + 1) % RGBM.length
    if (RGBM[rgbMode[th]] === 'static' || RGBM[rgbMode[th]] === 'breath') rgbHue++
    draw()
  }
  function toggleLamp() {
    const th = theme()
    lampOn[th] = !lampOn[th]
    draw()
  }

  // ---- Typing on his screen --------------------------------------------------------------------------------------
  // What you type goes to a real <input>, invisible and placed over his terminal: the canvas is only an image. A
  // mouse click on the drawn scene (not on the name or the empty wall) or Tab activates it. While it is active, his
  // terminal is outlined and waits ("type" and the cursor), and the _ after the name stops blinking. Esc releases
  // it; space types a space and does not scroll the page.
  let typingOn = false
  function setTyping(on) {
    if (cur) cur.classList.toggle('typing', on || typingOn)
  }
  function typed() {
    userTyping = 30
    setTyping(true)
    typingFrame = 1
    typeStep()
    if (reduced) {
      draw()
      clearTimeout(typed.t)
      typed.t = setTimeout(() => {
        typingFrame = 0
        setTyping(false)
        draw()
      }, 160)
    }
  }
  if (typer) {
    typer.addEventListener('focus', () => {
      typingOn = true
      hero.classList.add('px-typing')
      setTyping(true)
      draw()
    })
    typer.addEventListener('blur', () => {
      typingOn = false
      hero.classList.remove('px-typing')
      setTyping(userTyping > 0)
      draw()
    })
    typer.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        typer.blur()
      } else if (ev.key === 'Enter') {
        ev.preventDefault()
        const cmd = term.input.trim()
        if (cmd === 'clear') term.hist = []
        else if (cmd) term.hist.push(cmd)
        if (term.hist.length > 4) term.hist.shift()
        term.input = typer.value = ''
        if (cmd === 'whoami') turnToYou(90) // the answer is him
        typed()
      }
    })
    typer.addEventListener('input', () => {
      // only what his 3x5 font can draw
      const v = [...typer.value.toLowerCase()].filter((ch) => ch === ' ' || FONT[ch]).join('').slice(0, 60)
      if (typer.value !== v) typer.value = v
      term.input = v
      typed()
    })
  }

  // ---- Pointer: pointing at him, the pegboard keyboards, the tower, the lamp, the homelab ---------------------
  function native(ev) {
    const r = canvas.getBoundingClientRect()
    return { x: (ev.clientX - r.left) / S, y: (ev.clientY - r.top) / S }
  }
  const inside = (p, x, y, w, h) => p.x >= x && p.y >= y && p.x < x + w && p.y < y + h
  function targetAt(p) {
    if (inside(p, L.Jx - 24, L.Yd - 42, 48, 70)) return { kind: 'josu' }
    for (let i = 0; i < slots.length; i++) {
      const a = kbAt(i)
      if (slots[i].id && inside(p, a.x - 1, a.y - 1, a.w + 2, a.h + 4)) return { kind: 'slot', i }
    }
    if (inside(p, L.tower.x, L.tower.y, Wd('tower'), Ht('tower'))) return { kind: 'rgb' }
    if (L.showLamp && (inside(p, ...L.lampHead) || inside(p, ...L.lampArm))) return { kind: 'lamp' }
    if (inside(p, L.cab.x0, L.cab.y0, L.cab.x1 - L.cab.x0, L.cab.y1 - L.cab.y0)) return { kind: 'lab' }
    return null
  }
  // Is the pointer over the letters of the name? (the name points at him too)
  let onName = false
  function overName(ev) {
    const rg = document.createRange()
    rg.selectNodeContents(name)
    for (const q of rg.getClientRects()) if (ev.clientX >= q.left && ev.clientX <= q.right && ev.clientY >= q.top && ev.clientY <= q.bottom) return true
    return false
  }
  hero.addEventListener('pointermove', (ev) => {
    const n = overName(ev)
    if (n && !onName) turnToYou(40)
    onName = n
    if (ev.target.closest('a, button')) return
    pointer = native(ev)
    const t = targetAt(pointer)
    canvas.style.cursor = t ? 'pointer' : ''
    const on = !!t && t.kind === 'josu'
    if (on !== pointedAt) {
      pointedAt = on
      if (on) turnToYou(30)
      else holdTo = Math.max(holdTo, tick + 24)
      if (reduced && !on) {
        poseIdx = target = 0
        draw()
      }
    }
    if (reduced && poseIdx === 2) draw()
  })
  hero.addEventListener('pointerleave', () => {
    pointer = null
    if (pointedAt) {
      pointedAt = false
      holdTo = tick + 24
      if (reduced) {
        poseIdx = target = 0
        draw()
      }
    }
  })
  // A mouse click on the drawn scene sends keyboard input to his screen; a click outside it (empty wall, floor
  // under the name) releases it. Not on touch, so the phone's keyboard does not open.
  let lastPointer = 'mouse'
  canvas.addEventListener('pointerdown', (ev) => (lastPointer = ev.pointerType))
  canvas.addEventListener('click', (ev) => {
    const p = native(ev)
    const t = targetAt(p)
    if (t) act(t)
    if (!typer) return
    const [x0, y0, x1, y1] = L.scene
    const inScene = p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1
    if (inScene && lastPointer !== 'touch') typer.focus({ preventScroll: true })
    else if (!inScene && document.activeElement === typer) typer.blur()
  })
  function act(t) {
    if (t.kind === 'josu') turnToYou(70)
    else if (t.kind === 'slot') swap(t.i)
    else if (t.kind === 'rgb') cycleRgb()
    else if (t.kind === 'lamp') toggleLamp()
    else if (t.kind === 'lab') {
      labBurst = 60
      if (reduced) draw()
    }
  }

  // Invisible buttons for keyboard access (the mouse goes through them).
  function placeHot() {
    if (!hot || !L.peg) return
    const fi = [...hot.children].indexOf(document.activeElement)
    hot.textContent = ''
    const add = (label, [x, y, w, h], t) => {
      if (x + w < 0 || x >= NW) return
      const b = document.createElement('button')
      b.type = 'button'
      b.setAttribute('aria-label', label)
      Object.assign(b.style, { left: Math.max(0, x) * S + 'px', top: y * S + 'px', width: w * S + 'px', height: h * S + 'px' })
      b.addEventListener('click', () => act(t))
      hot.appendChild(b)
    }
    add('Josu: make him turn around', [L.Jx - 22, L.Yd - 42, 44, 64], { kind: 'josu' })
    slots.forEach((s, i) => {
      if (!s.id) return
      const a = kbAt(i)
      add(`Put the ${KB[s.id]} on the desk`, [a.x, a.y, a.w, a.h + 3], { kind: 'slot', i })
    })
    add('Change the PC lighting', [L.tower.x, L.tower.y, Wd('tower'), Ht('tower')], { kind: 'rgb' })
    if (L.showLamp) add('Turn the lamp on or off', [L.lamp.x, L.lamp.y, Wd('lamp'), Ht('lamp')], { kind: 'lamp' })
    add('Make the homelab LEDs blink', [L.cab.x0, L.cab.y0, L.cab.x1 - L.cab.x0 + 1, L.cab.y1 - L.cab.y0 + 1], { kind: 'lab' })
    if (fi >= 0) hot.children[fi]?.focus()
    // the text field, over the terminal panel on his screen (its focus ring frames the terminal)
    if (typer) {
      const tx = Math.round(L.MW * 0.63) + 1
      const y0 = L.scrTop[tx] + 4
      Object.assign(typer.style, {
        left: (L.mon.x + tx) * S + 'px',
        top: y0 * S + 'px',
        width: Math.max(8, L.MW - 2 - tx) * S + 'px',
        height: (L.scrBot[tx] - 2 - y0) * S + 'px',
      })
    }
  }

  // ---- Loop at 24 fps; stopped under reduced motion, off screen or with the tab hidden. ----------------------
  let last = 0
  let visible = false
  let running = false
  let seen = false
  function wake() {
    if (dead || reduced || running || !visible || document.hidden) return
    running = true
    requestAnimationFrame(loop)
  }
  function loop(now) {
    if (dead || !visible || reduced || document.hidden) {
      running = false
      return
    }
    requestAnimationFrame(loop)
    if (now - last < 1000 / 24) return
    last = now - ((now - last) % (1000 / 24))
    step()
    draw()
  }
  const io = new IntersectionObserver((es) => {
    // if it leaves and comes back before the observer fires, both entries arrive together: the last one wins
    const e = es[es.length - 1]
    const was = visible
    visible = e.isIntersecting
    if (!visible && typer && document.activeElement === typer) typer.blur()
    // on coming into view he turns to greet you (once per entry)
    if (visible && !was && !reduced) {
      const first = !seen
      seen = true
      setTimeout(() => visible && turnToYou(first ? 80 : 60), first ? 900 : 500)
    }
    wake()
  })
  io.observe(hero)
  document.addEventListener('visibilitychange', wake)
  function start() {
    if (dead) return
    if (!layout()) return requestAnimationFrame(start)
    draw()
    wake()
  }
  let lastW = 0
  const ro = new ResizeObserver(() => {
    const w = Math.round(hero.getBoundingClientRect().width)
    if (w === lastW) return
    lastW = w
    layout() && draw()
  })
  ro.observe(hero)
  document.fonts?.ready.then(() => !dead && layout() && draw())
  const mo = new MutationObserver(() => draw())
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  start()
  // Reduced motion switched on mid-visit: finish whatever is moving and show the still scene; switched off: resume.
  function onMotion() {
    reduced = motionQuery.matches
    if (!reduced) return wake()
    if (flight) land()
    clearTimeout(turnToYou.t)
    poseIdx = target = pointedAt ? 2 : 0
    frontAt = -1
    burst = 0
    labBurst = 0
    typingFrame = 0
    draw()
  }
  motionQuery.addEventListener('change', onMotion)
  // Leaving the page (ClientRouter) or a new run: stop the loop and drop everything that outlives the DOM.
  const teardown = () => {
    dead = true
    io.disconnect()
    ro.disconnect()
    mo.disconnect()
    motionQuery.removeEventListener('change', onMotion)
    document.removeEventListener('visibilitychange', wake)
    document.removeEventListener('astro:before-swap', teardown)
    if (stopRun === teardown) stopRun = null
  }
  stopRun = teardown
  document.addEventListener('astro:before-swap', teardown)
  // Test hook: the hero's tests set window.__s4test before the page loads, to read the scene's state. Nothing is
  // exposed on a normal visit.
  if (window.__s4test) window.__s4 = { L, tick: () => tick, state: () => ({ pose: POSES[poseIdx], target, deskKb, slots: slots.map((s) => s.id), rgb: { ...rgbMode }, lamp: { ...lampOn }, input: term.input, flight: !!flight, lab: labBurst, typing: typingOn, S, NW }) }
}
