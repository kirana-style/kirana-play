/**
 * The engine worker: loads Kirana's browser engine for one version, keeps one
 * project in its in-memory file system, and compiles it on request. A new
 * version gets a new worker; an engine once started cannot be unloaded.
 */
import type { KiranaConfig } from "@kirana-style/core/config"
import type * as Kirana from "@kirana-style/compiler-browser"
import type { Project } from "@kirana-style/compiler-browser"
import { transform } from "sucrase"

import { PREVIEW_PACKAGES } from "@/preview/protocol.ts"

import { isModule } from "./protocol.ts"
import type {
  Diagnostic,
  EngineRequest,
  EngineResponse,
  Files,
  Hint,
  Lens,
  Summary,
} from "./protocol.ts"

type BrowserEngine = typeof Kirana

let engine: BrowserEngine | undefined
let project: Project | undefined
const written = new Map<string, string>()

/** CommonJS for the preview frame: types and JSX gone, imports become `require()`. */
function commonJs(code: string, file: string): string {
  return transform(code, {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
    filePath: file,
  }).code
}

/** Opens a new project when the configuration changed, else writes what changed. */
function sync(declared: KiranaConfig, files: Files): Project {
  const config = {
    ...declared,
    externals: [...(declared.externals ?? []), ...PREVIEW_PACKAGES],
  }
  const json = engine!.configJson("/app", config, {})
  if (project?.configJson !== json) {
    project = engine!.createProject({
      config,
      // The language server's options, as an editor sends them: a summary
      // short enough to sit after an element on one line.
      language: { summaryLength: 72 },
    })
    written.clear()
  }
  for (const file of written.keys()) {
    if (!(file in files)) {
      project.remove(file)
      written.delete(file)
    }
  }
  for (const [file, code] of Object.entries(files)) {
    if (written.get(file) === code) continue
    project.write(file, code)
    written.set(file, code)
  }
  return project
}

function compile(config: KiranaConfig, files: Files) {
  const started = performance.now()
  const current = sync(config, files)
  const compiled: Record<string, string> = {}
  const modules: Record<string, string> = {}
  const diagnostics: Diagnostic[] = []
  for (const file of Object.keys(files).filter(isModule)) {
    const result = current.transform(file)
    const code = result.code ?? files[file]!
    compiled[file] = code
    diagnostics.push(...result.diagnostics)
    try {
      modules[file] = commonJs(code, file)
    } catch (error) {
      // Kirana parsed it, so this is rare: report it where the preview would fail.
      modules[file] =
        `throw new SyntaxError(${JSON.stringify(String((error as Error).message))})`
    }
  }
  diagnostics.push(...current.diagnostics())
  const css = current.stylesheet(false)
  // The compile's own time; the summaries below are the editor's, not its.
  const ms = performance.now() - started
  return {
    compiled,
    modules,
    css,
    diagnostics,
    ms,
    summaries: summariesOf(current, files),
  }
}

/** The language server's shapes, as much of them as the editor reads. */
type LspPlace = { line: number; character: number }
type LspHint = {
  position: LspPlace
  label: string
  data?: { parts?: { text: string; group: string }[] }
}
type LspLens = { range: { start: LspPlace }; command?: { title: string } }

/**
 * Each module's summary after `sx={…}` and code lenses on `css()`, from
 * Kirana's language server (0.3.6 and later; an older engine has none). A
 * failure here leaves the editor without them, never the compile.
 */
function summariesOf(
  current: Project,
  files: Files
): Record<string, Summary> | undefined {
  const language = (current as Partial<Project>).language
  if (!language) return undefined
  const summaries: Record<string, Summary> = {}
  for (const file of Object.keys(files).filter(isModule)) {
    try {
      const textDocument = { uri: language.uri(file) }
      const hints = language.request("textDocument/inlayHint", {
        textDocument,
        range: {
          start: { line: 0, character: 0 },
          end: { line: Number.MAX_SAFE_INTEGER, character: 0 },
        },
      }) as LspHint[] | null
      const lenses = language.request("textDocument/codeLens", {
        textDocument,
      }) as LspLens[] | null
      summaries[file] = {
        source: files[file]!,
        hints: (hints ?? []).map((hint): Hint => ({
          ...hint.position,
          label: hint.label,
          parts: hint.data?.parts ?? [{ text: hint.label, group: "" }],
        })),
        lenses: (lenses ?? []).flatMap((lens): Lens[] =>
          lens.command
            ? [{ ...lens.range.start, title: lens.command.title }]
            : []
        ),
      }
    } catch {
      // The editor goes without this file's summary.
    }
  }
  return summaries
}

/** Kirana's hover as markdown, or null where it has nothing to say. */
function hoverAt(file: string, line: number, character: number) {
  const language = (project as Partial<Project> | undefined)?.language
  if (!language) return null
  const hover = language.request("textDocument/hover", {
    textDocument: { uri: language.uri(file) },
    position: { line, character },
  }) as { contents?: string | { value: string } | { value: string }[] } | null
  const contents = hover?.contents
  if (!contents) return null
  if (typeof contents === "string") return contents
  return Array.isArray(contents)
    ? contents.map((part) => part.value).join("\n\n")
    : contents.value
}

async function handle(request: EngineRequest): Promise<unknown> {
  switch (request.type) {
    case "load": {
      const url = new URL(
        `/engine/${request.version}/compiler.js`,
        location.origin
      )
      // Asked first, so a release without a browser engine says so: a failed
      // `import()` only says that it failed.
      const probe = await fetch(url)
      if (!probe.ok)
        throw new Error(
          probe.status === 404
            ? `@kirana-style/compiler-browser@${request.version} is not on npm`
            : `the engine answered ${probe.status} ${probe.statusText}`
        )
      engine = (await import(/* @vite-ignore */ url.href)) as BrowserEngine
      return request.version
    }
    case "config":
      return commonJs(request.source, "kirana.config.ts")
    case "hover":
      return hoverAt(request.file, request.line, request.character)
    case "compile":
      if (!engine) throw new Error("the engine is not loaded")
      return compile((request.config ?? {}) as KiranaConfig, request.files)
  }
}

self.addEventListener("message", (event: MessageEvent<EngineRequest>) => {
  const request = event.data
  handle(request).then(
    (value) =>
      self.postMessage({
        id: request.id,
        ok: true,
        value,
      } satisfies EngineResponse),
    (error: unknown) =>
      self.postMessage({
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies EngineResponse)
  )
})
