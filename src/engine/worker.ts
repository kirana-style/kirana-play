/**
 * The engine worker: loads Kirana's browser engine for one version, keeps one
 * project in its in-memory file system, and compiles it on request. A new
 * version gets a new worker; an engine once started cannot be unloaded.
 */
import { transform } from "sucrase"

import { isModule } from "./protocol.ts"
import type {
  Diagnostic,
  EngineRequest,
  EngineResponse,
  Files,
} from "./protocol.ts"

type Transformed = {
  code?: string
  diagnostics: Diagnostic[]
}

type Project = {
  configJson: string
  write: (file: string, code: string) => string[]
  remove: (file: string) => void
  transform: (file: string) => Transformed
  stylesheet: (minify?: boolean) => string
  diagnostics: () => Diagnostic[]
  files: () => string[]
}

type BrowserEngine = {
  createProject: (options: { config?: unknown; files?: Files }) => Project
  configJson: (root: string, config: unknown, inline: unknown) => string
}

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
function sync(config: unknown, files: Files): Project {
  const json = engine!.configJson("/app", config ?? {}, {})
  if (project?.configJson !== json) {
    project = engine!.createProject({ config: config ?? {} })
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

function compile(config: unknown, files: Files) {
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
  return {
    compiled,
    modules,
    css: current.stylesheet(false),
    diagnostics,
    ms: performance.now() - started,
  }
}

async function handle(request: EngineRequest): Promise<unknown> {
  switch (request.type) {
    case "load": {
      const url = new URL(
        `/engine/${request.version}/compiler.js`,
        location.origin
      )
      engine = (await import(/* @vite-ignore */ url.href)) as BrowserEngine
      return request.version
    }
    case "config":
      return commonJs(request.source, "kirana.config.ts")
    case "compile":
      if (!engine) throw new Error("the engine is not loaded")
      return compile(request.config, request.files)
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
