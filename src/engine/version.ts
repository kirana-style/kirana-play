import core from "@kirana-style/core/package.json" with { type: "json" }

/**
 * The Kirana release the playground opens with: the one it is built with,
 * which Dependabot's `kirana` group moves with every `@kirana-style/*` package.
 */
export const DEFAULT_VERSION: string = core.version
