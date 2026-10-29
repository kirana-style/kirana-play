/**
 * What the page and the TypeScript worker say to each other. Offsets are
 * UTF-16 positions in the file's text, as CodeMirror and TypeScript count.
 */
import type { Files } from "@/engine/protocol.ts"

/** A piece of a signature or a type, with what kind of thing it names. */
export type Part = { text: string; kind: string }

export type Completion = {
  name: string
  /** TypeScript's `ScriptElementKind`: `property`, `method`, `const`, … */
  kind: string
  sortText: string
  insertText?: string
  /** Where the completion replaces text, when not just the word before the cursor. */
  replace?: { start: number; end: number }
  /** What `details` needs to find this entry again. */
  source?: string
  data?: unknown
}

export type Completions = { entries: Completion[] }

export type Details = { signature: Part[]; documentation: string }

export type Hover = {
  start: number
  end: number
  signature: Part[]
  documentation: string
}

/** A file and the text it has in the editor right now. */
type At = { file: string; code: string; offset: number }

export type LanguageRequest =
  | { id: number; type: "sync"; files: Files }
  | ({ id: number; type: "completions" } & At)
  | ({
      id: number
      type: "details"
      name: string
      source?: string
      data?: unknown
    } & At)
  | ({ id: number; type: "hover" } & At)

export type LanguageResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: string }

/** Whether TypeScript reads a file of the project. */
export function isTypeScript(file: string): boolean {
  return /\.(?:tsx?|jsx?|mts|mjs)$/.test(file)
}
