/**
 * What the page and the engine worker say to each other. The engine is
 * `@kirana-style/compiler-browser` at the version the page picked, loaded in
 * the worker from `/engine/<version>/` (the Worker proxies npm), so its types
 * are written here rather than imported: the page never bundles an engine.
 */

/** A place in a file: line and column from 1, the column in UTF-16 code units. */
export type Position = { line: number; column: number }

/** A diagnostic as the engine reports it, with where it is in its file. */
export type Diagnostic = {
  code: string
  name: string
  severity: "info" | "warning" | "error"
  /** The file, relative to the project root; empty for the project as a whole. */
  file: string
  message: string
  help: string[]
  start?: Position
  end?: Position
}

/** The project's files, by path relative to its root (`App.tsx`, `src/tokens.ts`). */
export type Files = Readonly<Record<string, string>>

export type CompileOutput = {
  /** Each module as Kirana rewrote it, still TypeScript and JSX. */
  compiled: Record<string, string>
  /** Each module as CommonJS for the preview: Kirana's output, then Sucrase. */
  modules: Record<string, string>
  /** The stylesheet. */
  css: string
  diagnostics: Diagnostic[]
  /** How long the compile took in the worker, in milliseconds. */
  ms: number
}

export type EngineRequest =
  | { id: number; type: "load"; version: string }
  /** The configuration module as CommonJS, for the preview frame to evaluate. */
  | { id: number; type: "config"; source: string }
  | { id: number; type: "compile"; config: unknown; files: Files }

export type EngineResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: string }

/** The file the configuration lives in; it is evaluated, never compiled. */
export const CONFIG_FILE = "kirana.config.ts"

/** Whether a file is a module Kirana compiles. */
export function isModule(file: string): boolean {
  return /\.(?:tsx?|jsx?|mts|mjs)$/.test(file) && file !== CONFIG_FILE
}
