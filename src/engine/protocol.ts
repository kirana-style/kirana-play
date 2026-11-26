/**
 * What the page and the engine worker say to each other. The engine is
 * `@kirana-style/compiler-browser` at the version the page picked, loaded in
 * the worker from `/engine/<version>/` (the Worker proxies npm); only its
 * types come from the dependency, so the page never bundles an engine.
 */
import type { Diagnostic } from "@kirana-style/compiler-browser"

export type { Diagnostic, Position } from "@kirana-style/compiler-browser"

/** The project's files, by path relative to its root (`app.tsx`, `src/tokens.ts`). */
export type Files = Readonly<Record<string, string>>

/** A place as the language server counts it: line and character from 0, in UTF-16. */
export type Place = { line: number; character: number }

/** The summary after `sx={…}`: what the element receives, in parts by group. */
export type Hint = Place & {
  label: string
  parts: { text: string; group: string }[]
}

/** The code lens on a `css()` or `recipe()`: its counts, and how many elements use it. */
export type Lens = Place & { title: string }

/** A colour literal or a colour token, and the colour it is (`rgb(…)`). */
export type Swatch = Place & { css: string }

/** A quick fix for a diagnostic: the edits that apply it. */
export type Fix = Place & {
  /** The diagnostic's code (`KRN1203`), with `line` and `character` where it starts. */
  code: string
  title: string
  edits: { start: Place; end: Place; text: string }[]
}

/** A module's summary, lenses, swatches and fixes, for the text they were computed from. */
export type Summary = {
  source: string
  hints: Hint[]
  lenses: Lens[]
  swatches: Swatch[]
  fixes: Fix[]
}

/** A completion from Kirana's language server: condition keys, `select.`, utility strings. */
export type KiranaCompletion = {
  label: string
  detail?: string
  /** LSP's `CompletionItemKind`. */
  kind?: number
  sortText?: string
  from: Place
  to: Place
  insert: string
  /** `insert` holds snippet placeholders (`$1`, `${1:state}`). */
  snippet: boolean
}

export type CompileOutput = {
  /** Each module as Kirana rewrote it, still TypeScript and JSX. */
  compiled: Record<string, string>
  /** Each module as CommonJS for the preview: Kirana's output, then Sucrase. */
  modules: Record<string, string>
  /** The stylesheet. */
  css: string
  /** The stylesheet minified, as a production build writes it. */
  minified: string
  diagnostics: Diagnostic[]
  /** How long the compile took in the worker, in milliseconds. */
  ms: number
  /**
   * Each module's summary and lenses from Kirana's language server, when the
   * engine has one (0.3.6 and later).
   */
  summaries?: Record<string, Summary>
}

export type EngineRequest =
  | { id: number; type: "load"; version: string }
  /** The configuration module as CommonJS, for the preview frame to evaluate. */
  | { id: number; type: "config"; source: string }
  | { id: number; type: "compile"; config: unknown; files: Files }
  /** Kirana's hover at a place in a module, as markdown. */
  | ({ id: number; type: "hover"; file: string } & Place)
  /** Kirana's completions at a place in a module, with its text as typed. */
  | ({ id: number; type: "complete"; file: string; code: string } & Place)

export type EngineResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: string }

/** The file the configuration lives in; it is evaluated, never compiled. */
export const CONFIG_FILE = "kirana.config.ts"

/** Whether a file is a module Kirana compiles. */
export function isModule(file: string): boolean {
  return /\.(?:tsx?|jsx?|mts|mjs)$/.test(file) && file !== CONFIG_FILE
}
