/**
 * Compiling the project as it is edited: the configuration is turned into
 * CommonJS by the engine worker, evaluated in the preview frame (it is the
 * user's code), handed to the engine with the files, and what comes back is
 * rendered in the frame.
 */
import { useEffect, useRef, useState } from "react"

import { startEngine } from "@/engine/client.ts"
import type { Engine } from "@/engine/client.ts"
import { CONFIG_FILE, isModule } from "@/engine/protocol.ts"
import type { CompileOutput, Diagnostic, Files } from "@/engine/protocol.ts"
import type { Frame } from "@/preview/frame.ts"

export type Status =
  | { kind: "loading"; version: string }
  | { kind: "compiling" }
  | { kind: "done"; ms: number }
  | { kind: "failed"; message: string }

export type Compiled = CompileOutput & { config?: Diagnostic }

const DEBOUNCE = 150

/** The entry the preview renders: `App.tsx` when there is one, else the first module. */
export function entryOf(files: Files): string | undefined {
  if ("App.tsx" in files) return "App.tsx"
  return Object.keys(files).find(isModule)
}

function configProblem(message: string): Diagnostic {
  return {
    code: "PLAY",
    name: "configuration",
    severity: "error",
    file: CONFIG_FILE,
    message: `the configuration could not be evaluated: ${message}`,
    help: [],
    start: { line: 1, column: 1 },
    end: { line: 1, column: 1 },
  }
}

export function useCompiler(
  version: string,
  files: Files,
  frame: Frame | undefined
) {
  // Each status belongs to the version it was reached with, so a new version
  // reads as loading until its engine reports.
  const [reached, setReached] = useState<{ version: string; status: Status }>({
    version,
    status: { kind: "loading", version },
  })
  const status: Status =
    reached.version === version ? reached.status : { kind: "loading", version }
  const [output, setOutput] = useState<Compiled>()
  const engine = useRef<Engine>(undefined)
  const run = useRef(0)
  // The configuration, evaluated once per source.
  const config = useRef<{
    source?: string
    value: unknown
    problem?: Diagnostic
  }>({ value: {} })

  useEffect(() => {
    const started = startEngine(version)
    engine.current = started
    started.ready.catch((error: Error) =>
      setReached({
        version,
        status: {
          kind: "failed",
          message: `Kirana ${version} did not start: ${error.message}`,
        },
      })
    )
    return () => {
      started.dispose()
      if (engine.current === started) engine.current = undefined
    }
  }, [version])

  useEffect(() => {
    const current = engine.current
    if (!current || !frame) return
    const id = ++run.current
    const timer = setTimeout(async () => {
      try {
        await current.ready
        if (id !== run.current) return
        setReached({ version, status: { kind: "compiling" } })
        const source = files[CONFIG_FILE]
        if (source !== config.current.source) {
          try {
            const code = source ? await current.config(source) : undefined
            config.current = {
              source,
              value: code === undefined ? {} : await frame.config(code),
            }
          } catch (error) {
            config.current = {
              source,
              value: {},
              problem: configProblem((error as Error).message),
            }
          }
        }
        const compiled = await current.compile(config.current.value, files)
        if (id !== run.current) return
        setOutput({ ...compiled, config: config.current.problem })
        setReached({ version, status: { kind: "done", ms: compiled.ms } })
        const entry = entryOf(files)
        if (entry)
          frame.render({
            modules: compiled.modules,
            css: compiled.css,
            entry,
            runtime: new URL(`/engine/${version}/runtime.js`, location.origin)
              .href,
          })
      } catch (error) {
        if (id === run.current)
          setReached({
            version,
            status: { kind: "failed", message: (error as Error).message },
          })
      }
    }, DEBOUNCE)
    return () => clearTimeout(timer)
  }, [files, frame, version])

  return { status, output }
}
