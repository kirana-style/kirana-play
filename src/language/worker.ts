/**
 * The editor's TypeScript: a language service over the project's files, the
 * types they import (React, csstype, Kirana's core) and TypeScript's own
 * libraries, all in memory. TypeScript 6 is the last release written in
 * JavaScript; the repository's own checks run TypeScript 7, which has no
 * browser build.
 */
import ts from "typescript-browser"
import {
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs"
import type { VirtualTypeScriptEnvironment } from "@typescript/vfs"

import type { Files } from "@/engine/protocol.ts"

import { isTypeScript } from "./protocol.ts"
import type {
  Completions,
  Details,
  Hover,
  LanguageRequest,
  LanguageResponse,
  Part,
} from "./protocol.ts"

/** As a project made with Kirana and React would set them. */
const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: ["@kirana-style/core/react"],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  allowImportingTsExtensions: true,
}

type Loaders = Record<string, () => Promise<string>>

/**
 * `@typescript/vfs` is typed against the package named `typescript`, which in
 * this repository is TypeScript 7, without the language service's types. At
 * run time it is handed TypeScript 6 and uses the same API, so the two meet
 * here, cast once each way.
 */
type VfsTypeScript = Parameters<typeof createVirtualTypeScriptEnvironment>[2]

/** TypeScript's libraries, each loaded when the chain from `lib` reaches it. */
const LIBRARIES = import.meta.glob(
  "../../node_modules/typescript-browser/lib/lib.*.d.ts",
  { query: "?raw", import: "default" }
) as Loaders

/**
 * The packages a project can import types from: what the preview gives it
 * (React) and Kirana's core, at the version the playground is built with.
 */
const PACKAGES = import.meta.glob(
  [
    "../../node_modules/@types/react/{index,global,jsx-runtime,jsx-dev-runtime}.d.ts",
    "../../node_modules/@types/react/package.json",
    "../../node_modules/@types/react-dom/{index,client}.d.ts",
    "../../node_modules/@types/react-dom/package.json",
    "../../node_modules/csstype/index.d.ts",
    "../../node_modules/csstype/package.json",
    "../../node_modules/@kirana-style/core/src/*.d.ts",
    "../../node_modules/@kirana-style/core/package.json",
  ],
  { query: "?raw", import: "default" }
) as Loaders

const path = (file: string) => `/${file}`

async function libraries(map: Map<string, string>) {
  const byName = new Map(
    Object.entries(LIBRARIES).map(([key, load]) => [
      key.slice(key.lastIndexOf("/") + 1),
      load,
    ])
  )
  const queue = [...(OPTIONS.lib ?? [])]
  while (queue.length) {
    const name = queue.pop()!
    if (map.has(`/${name}`)) continue
    const text = await byName.get(name)?.()
    if (text === undefined) continue
    map.set(`/${name}`, text)
    for (const [, lib] of text.matchAll(/\/\/\/ <reference lib="([^"]+)"/g))
      queue.push(`lib.${lib!.toLowerCase()}.d.ts`)
  }
}

async function packages(map: Map<string, string>) {
  await Promise.all(
    Object.entries(PACKAGES).map(async ([key, load]) =>
      map.set(key.slice(key.indexOf("/node_modules/")), await load())
    )
  )
}

/** The project's files TypeScript reads, by their path in the project. */
let project: Files = {}
let environment: Promise<VirtualTypeScriptEnvironment> | undefined

function start(): Promise<VirtualTypeScriptEnvironment> {
  environment ??= (async () => {
    const map = new Map<string, string>()
    await Promise.all([libraries(map), packages(map)])
    const roots = Object.keys(project).filter(isTypeScript)
    for (const file of roots) map.set(path(file), project[file]!)
    return createVirtualTypeScriptEnvironment(
      createSystem(map),
      roots.map(path),
      ts as unknown as VfsTypeScript,
      OPTIONS as unknown as Parameters<
        typeof createVirtualTypeScriptEnvironment
      >[3]
    )
  })()
  return environment
}

/** Writes what changed; `createFile` replaces a file it already has. */
async function sync(files: Files) {
  const previous = project
  project = files
  if (!environment) return
  const env = await environment
  for (const file of Object.keys(previous))
    if (!(file in files) && isTypeScript(file)) env.deleteFile(path(file))
  for (const [file, code] of Object.entries(files))
    if (isTypeScript(file) && previous[file] !== code)
      env.createFile(path(file), code)
}

/** The service, with `file` as the editor has it this keystroke. */
async function at(file: string, code: string) {
  const env = await start()
  if (project[file] !== code) {
    project = { ...project, [file]: code }
    env.createFile(path(file), code)
  }
  return env.languageService as unknown as ts.LanguageService
}

const parts = (display?: ts.SymbolDisplayPart[]): Part[] =>
  (display ?? []).map(({ text, kind }) => ({ text, kind }))

const prose = (display?: ts.SymbolDisplayPart[]) =>
  (display ?? []).map(({ text }) => text).join("")

async function handle(request: LanguageRequest): Promise<unknown> {
  switch (request.type) {
    case "sync":
      await sync(request.files)
      return null
    case "completions": {
      const service = await at(request.file, request.code)
      const info = service.getCompletionsAtPosition(
        path(request.file),
        request.offset,
        {
          includeCompletionsWithInsertText: true,
          includeAutomaticOptionalChainCompletions: true,
        }
      )
      return {
        entries: (info?.entries ?? []).map((entry) => ({
          name: entry.name,
          kind: entry.kind,
          sortText: entry.sortText,
          insertText: entry.insertText,
          replace: entry.replacementSpan && {
            start: entry.replacementSpan.start,
            end: entry.replacementSpan.start + entry.replacementSpan.length,
          },
          source: entry.source,
          data: entry.data,
        })),
      } satisfies Completions
    }
    case "details": {
      const service = await at(request.file, request.code)
      const details = service.getCompletionEntryDetails(
        path(request.file),
        request.offset,
        request.name,
        undefined,
        request.source,
        undefined,
        request.data as ts.CompletionEntryData | undefined
      )
      return details
        ? ({
            signature: parts(details.displayParts),
            documentation: prose(details.documentation),
          } satisfies Details)
        : null
    }
    case "hover": {
      const service = await at(request.file, request.code)
      const info = service.getQuickInfoAtPosition(
        path(request.file),
        request.offset
      )
      return info
        ? ({
            start: info.textSpan.start,
            end: info.textSpan.start + info.textSpan.length,
            signature: parts(info.displayParts),
            documentation: prose(info.documentation),
          } satisfies Hover)
        : null
    }
  }
}

self.addEventListener("message", (event: MessageEvent<LanguageRequest>) => {
  const request = event.data
  handle(request).then(
    (value) =>
      self.postMessage({
        id: request.id,
        ok: true,
        value,
      } satisfies LanguageResponse),
    (error: unknown) =>
      self.postMessage({
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies LanguageResponse)
  )
})
