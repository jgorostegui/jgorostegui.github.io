/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Build-time flag: enables Pagefind indexing. Set to 'true' to enable. */
  readonly ENABLE_SEARCH?: string
  /** Build-time flag: enables dynamic OG image endpoint. Set to 'true' to enable. */
  readonly ENABLE_OG_IMAGES?: string
  /** Cloudflare Web Analytics site token. Presence enables analytics injection. */
  readonly PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
