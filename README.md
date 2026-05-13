# Josu Gorostegui

My personal blog. Writing about artificial intelligence, software engineering,
machine learning, and the system design underneath practical AI work.

## Development

This site is built with [Astro](https://astro.build/) and runs on
[Bun](https://bun.sh/).

To run it locally:

```bash
bun install
bun run dev
```

Then open:

```text
http://localhost:1240
```

## Scripts

```bash
bun run dev      # Start the Astro dev server
bun run build    # Type-check, build the static site, and run postbuild tasks
bun run preview  # Preview the production build locally
bun run prettier # Format TypeScript, CSS, and Astro files
```

`bun run build` writes the generated site to `dist/` and runs the postbuild
tasks, including the Pagefind search index when search is enabled.
