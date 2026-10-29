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
