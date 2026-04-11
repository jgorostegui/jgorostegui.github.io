import { execSync } from 'node:child_process'

function sh(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return fallback
  }
}

const REPO_URL = 'https://github.com/jgorostegui/jgorostegui.github.io'

// Evaluated once at module load. Empty string on failure so consumers can
// conditionally render instead of linking to a broken /commit/dev URL.
const sha = sh('git rev-parse HEAD', '')

export const GIT_SHA = sha
export const GIT_COMMIT = sha ? sha.slice(0, 7) : ''
export const GIT_COMMIT_URL = sha ? `${REPO_URL}/commit/${sha}` : null
