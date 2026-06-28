import { existsSync } from 'node:fs'
import { chromium, type Page } from 'playwright'

const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:4321'
const localChromiumPath = '/snap/bin/chromium'
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (existsSync(localChromiumPath) ? localChromiumPath : undefined)
const routes = [
  '/tags/',
  '/blog/fitness-copilot-kiroween-2025/',
  '/blog/mlops-machine-learning-operations/',
  '/blog/wrong-abstraction-agent-tools/',
]
const tagRoutes = [
  'llm',
  'kiro',
  'ai',
  'mlops',
  'spec-driven-development',
  'software',
]

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
})
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
})
const failures: string[] = []

function collectConsoleFailures(page: Page): string[] {
  const logs: string[] = []
  page.removeAllListeners('console')
  page.on('console', (msg) => {
    if (['warning', 'warn', 'error'].includes(msg.type())) {
      logs.push(`${msg.type()}: ${msg.text()}`)
    }
  })

  return logs
}

for (const route of routes) {
  const logs = collectConsoleFailures(page)

  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(500)
  const tagLinks = await page.$$eval('a[href^="/tags/"]', (links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  )
  const state = await page.evaluate(() => ({
    overflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    brokenImages: Array.from(document.images).filter(
      (img) => img.complete && img.naturalWidth === 0,
    ).length,
  }))

  if (response?.status() !== 200) {
    failures.push(`${route} returned ${response?.status()}`)
  }
  if (tagLinks.some((href) => !href.endsWith('/'))) {
    failures.push(`${route} has tag links without trailing slash`)
  }
  if (logs.length > 0) {
    failures.push(`${route} has console warnings/errors: ${logs.join('; ')}`)
  }
  if (state.overflow) {
    failures.push(`${route} has mobile horizontal overflow`)
  }
  if (state.brokenImages > 0) {
    failures.push(`${route} has ${state.brokenImages} broken images`)
  }
}

for (const tag of tagRoutes) {
  const response = await page.goto(`${baseUrl}/tags/${tag}/`, {
    waitUntil: 'domcontentloaded',
  })

  if (response?.status() !== 200) {
    failures.push(`/tags/${tag}/ returned ${response?.status()}`)
  }
}

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)
const mobileTrigger = page.locator('button[aria-label="Open navigation menu"]')
await mobileTrigger.click()
await page.waitForSelector('#mobile-navigation a')
const expanded = await mobileTrigger.getAttribute('aria-expanded')
const navLinks = await page.$$eval('#mobile-navigation a', (links) =>
  links.map((link) => link.textContent?.trim()),
)
await page.keyboard.press('Escape')
const collapsed = await mobileTrigger.getAttribute('aria-expanded')
const focusedLabel = await page.evaluate(
  () => document.activeElement?.getAttribute('aria-label') ?? '',
)

if (expanded !== 'true') {
  failures.push('mobile navigation did not open')
}
if (collapsed !== 'false') {
  failures.push('mobile navigation did not close with Escape')
}
if (focusedLabel !== 'Open navigation menu') {
  failures.push('mobile navigation did not restore focus to trigger')
}
if (navLinks.join(',') !== 'blog,about') {
  failures.push(`mobile navigation links mismatch: ${navLinks.join(',')}`)
}

await page.route('**/pagefind/pagefind.js', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  await route.continue()
})

const searchLogs = collectConsoleFailures(page)
await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
await page.locator('button[aria-label="Search (Cmd+K)"]').click()
await page.getByLabel('Search query').fill('MLOps')
await page
  .locator('a', { hasText: 'MLOps (Machine Learning Operations)' })
  .first()
  .waitFor({ timeout: 10_000 })

if (searchLogs.length > 0) {
  failures.push(`search has console warnings/errors: ${searchLogs.join('; ')}`)
}

await browser.close()

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`Verified ${baseUrl}`)
