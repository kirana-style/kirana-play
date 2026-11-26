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
  Fix,
  Hint,
  KiranaCompletion,
  Lens,
  Summary,
  Swatch,
  Theme,
} from "./protocol.ts"

type BrowserEngine = typeof Kirana

let engine: BrowserEngine | undefined
let project: Project | undefined
/** The colour scheme the language server last drew for. */
let theme: Theme = "light"
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
      // short enough to sit after an element on one line, and the style card
      // as VS Code shows it, its box model and swatches drawn as images and
      // its tables side by side. The page runs no commands, so no links to them.
      language: { summaryLength: 72, images: true, html: true, theme },
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
  // A production build in a session of its own (0.4.3 and later). The
  // readable output above stands without it.
  let production: ReturnType<Project["production"]> | undefined
  try {
    production = (current as Partial<Project>).production?.()
  } catch {
    production = undefined
  }
  return {
    compiled,
    modules,
    css,
    minified: current.stylesheet(true),
    production,
    diagnostics,
    ms,
    summaries: summariesOf(current, files, diagnostics),
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
type LspRange = { start: LspPlace; end: LspPlace }
type LspColour = {
  range: LspRange
  color: { red: number; green: number; blue: number; alpha: number }
}
type LspAction = {
  kind?: string
  edit?: { changes?: Record<string, { range: LspRange; newText: string }[]> }
  title: string
}
type LspCompletion = {
  label: string
  detail?: string
  kind?: number
  sortText?: string
  insertTextFormat?: number
  textEdit?: { range: LspRange; newText: string }
}

/** LSP's item kinds for a value and a colour: TypeScript offers those already. */
const VALUE_KINDS = new Set([12, 16])

const css = ({ red, green, blue, alpha }: LspColour["color"]) =>
  `rgb(${Math.round(red * 255)} ${Math.round(green * 255)} ${Math.round(blue * 255)} / ${alpha})`

/** Where an engine diagnostic sits, as the language server counts. */
const lspRange = (diagnostic: Diagnostic): LspRange | undefined =>
  diagnostic.start && diagnostic.end
    ? {
        start: {
          line: diagnostic.start.line - 1,
          character: diagnostic.start.column - 1,
        },
        end: {
          line: diagnostic.end.line - 1,
          character: diagnostic.end.column - 1,
        },
      }
    : undefined

/**
 * Each module's summary after `sx={…}` and code lenses on `css()`, from
 * Kirana's language server (0.3.6 and later; an older engine has none). A
 * failure here leaves the editor without them, never the compile.
 */
function summariesOf(
  current: Project,
  files: Files,
  diagnostics: Diagnostic[]
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
      const colours = language.request("textDocument/documentColor", {
        textDocument,
      }) as LspColour[] | null
      // A diagnostic the server can repair (`width: 5` → `"5px"`, a
      // misspelt property) carries its quick fix to the editor.
      const fixes = diagnostics.flatMap((diagnostic): Fix[] => {
        const range = lspRange(diagnostic)
        if (diagnostic.file !== file || !range) return []
        const actions = language.request("textDocument/codeAction", {
          textDocument,
          range,
          context: {
            diagnostics: [
              {
                range,
                message: diagnostic.message,
                data: { code: diagnostic.code },
              },
            ],
          },
        }) as LspAction[] | null
        const fix = actions?.find((action) => action.kind === "quickfix")
        const edits = fix && Object.values(fix.edit?.changes ?? {}).flat()
        return fix && edits?.length
          ? [
              {
                ...range.start,
                code: diagnostic.code,
                title: fix.title,
                edits: edits.map((change) => ({
                  start: change.range.start,
                  end: change.range.end,
                  text: change.newText,
                })),
              },
            ]
          : []
      })
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
        swatches: (colours ?? []).map((colour): Swatch => ({
          ...colour.range.start,
          css: css(colour.color),
        })),
        fixes,
      }
    } catch {
      // The editor goes without this file's summary.
    }
  }
  return summaries
}

/**
 * Kirana's completions where TypeScript has none: condition keys (`":hover"`,
 * `"@media (…)"`), `select.`'s targets and utility strings. The text as typed
 * is written first, since the last compile may be a keystroke behind.
 */
function completionsAt(
  file: string,
  code: string,
  line: number,
  character: number
): KiranaCompletion[] {
  const language = (project as Partial<Project> | undefined)?.language
  if (!project || !language) return []
  if (written.get(file) !== code) {
    project.write(file, code)
    written.set(file, code)
  }
  const result = language.request("textDocument/completion", {
    textDocument: { uri: language.uri(file) },
    position: { line, character },
  }) as LspCompletion[] | { items: LspCompletion[] } | null
  const items = Array.isArray(result) ? result : (result?.items ?? [])
  return items.flatMap((item): KiranaCompletion[] =>
    item.textEdit && !VALUE_KINDS.has(item.kind ?? 0)
      ? [
          {
            label: item.label,
            detail: item.detail,
            kind: item.kind,
            sortText: item.sortText,
            from: item.textEdit.range.start,
            to: item.textEdit.range.end,
            insert: item.textEdit.newText,
            snippet: item.insertTextFormat === 2,
          },
        ]
      : []
  )
}

/** Kirana's hover as markdown, or null where it has nothing to say. */
function hoverAt(file: string, line: number, character: number, scheme: Theme) {
  const language = (project as Partial<Project> | undefined)?.language
  if (!language) return null
  if (scheme !== theme) {
    language.notify("kirana/theme", { theme: scheme })
    theme = scheme
  }
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
    case "complete":
      return completionsAt(
        request.file,
        request.code,
        request.line,
        request.character
      )
    case "hover":
      return hoverAt(
        request.file,
        request.line,
        request.character,
        request.theme
      )
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
