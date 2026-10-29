// The two pieces of the Workers runtime the server code uses, declared here
// rather than through `wrangler types`, whose output is generated per machine.

declare module "cloudflare:workers" {
  export const env: {
    /**
     * Development only (`.dev.vars`): where the engine's files are fetched
     * from instead of npm, for a Kirana build not yet released.
     */
    readonly KIRANA_ENGINE_URL?: string
  }
}

interface CacheStorage {
  /** The data centre's cache, which Workers' `fetch` responses can be put in. */
  readonly default: Cache
}
