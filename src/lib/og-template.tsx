/**
 * Satori JSX template for Open Graph cards.
 *
 * Consumed by src/pages/og/[...slug].png.ts. Two modes:
 *
 * - `default`: branded card for non-post pages (home, about, 404)
 * - `post`: per-post card with title, date, tag list
 *
 * Satori constraints to keep in mind:
 * - Every element with children must set `display: flex` (no implicit flow).
 * - No `display: grid`, no `gap` on non-flex containers.
 * - Font names must match the `fonts[]` entries passed to satori().
 * - Single-line children need an explicit width or `whiteSpace: 'nowrap'`.
 */

export type OgTemplateProps =
  | { kind: 'default' }
  | {
      kind: 'post'
      title: string
      date: Date
      tags: string[]
    }

const BG = '#0a0a0a'
const FG = '#fafafa'
const MUTED = '#a1a1a1'
const BORDER = '#262626'
const ACCENT = '#60a5fa'

const SITE_DOMAIN = 'jgorostegui.github.io'
const AUTHOR = 'Josu Gorostegui'
const TAGLINE =
  'Artificial Intelligence, Software Engineering, Machine Learning, Technology'

export function OgTemplate(props: OgTemplateProps) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG,
        color: FG,
        fontFamily: 'Geist',
        padding: '72px 80px',
        position: 'relative',
      }}
    >
      <Header />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {props.kind === 'default' ? (
          <DefaultBody />
        ) : (
          <PostBody {...props} />
        )}
      </div>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'JetBrainsMono',
        fontSize: 24,
        color: MUTED,
      }}
    >
      <span style={{ color: ACCENT, marginRight: 12 }}>$</span>
      <span>{SITE_DOMAIN}</span>
    </div>
  )
}

function Footer() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'JetBrainsMono',
        fontSize: 20,
        color: MUTED,
        borderTop: `1px solid ${BORDER}`,
        paddingTop: 24,
      }}
    >
      <span>{AUTHOR}</span>
      <span>github / twitter / linkedin / medium</span>
    </div>
  )
}

function DefaultBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: 28,
          color: FG,
        }}
      >
        {AUTHOR}
      </div>
      <div
        style={{
          fontSize: 30,
          lineHeight: 1.35,
          color: MUTED,
          maxWidth: 900,
        }}
      >
        {TAGLINE}
      </div>
    </div>
  )
}

type PostBodyProps = {
  title: string
  date: Date
  tags: string[]
}

function PostBody({ title, date, tags }: PostBodyProps) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: 36,
          color: FG,
          maxWidth: 1040,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'JetBrainsMono',
          fontSize: 22,
          color: MUTED,
        }}
      >
        <span>{formatted}</span>
        {tags.length > 0 && (
          <>
            <span style={{ margin: '0 16px', color: BORDER }}>/</span>
            <span>{tags.slice(0, 4).join('  ·  ')}</span>
          </>
        )}
      </div>
    </div>
  )
}
