import getConfig from 'next/config'

// The Portal's webpack config provides `process/browser` to every bundle, so a
// bare `process.env.X` in API routes can resolve to an empty shim at runtime.
// Server-only settings are therefore exposed through serverRuntimeConfig
// (next.config.js), with a process.env fallback for tests and scripts.
export type ServerEnvName =
  | 'CHATBOT_API_URL'
  | 'EUROPEANA_API_KEY'
  | 'EUROPEANA_CHATBOT_PORTAL_URL'
  | 'EUROPEANA_INGEST_PRIVATE_KEY_B64'

export function serverEnv(name: ServerEnvName): string | undefined {
  const value =
    getConfig()?.serverRuntimeConfig?.[name] ??
    (typeof process !== 'undefined' ? process.env?.[name] : undefined)
  return typeof value === 'string' && value.trim() ? value : undefined
}
