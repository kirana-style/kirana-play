/**
 * The page's side of the engine worker: one worker per Kirana version, and a
 * promise per request.
 */
import type {
  CompileOutput,
  EngineRequest,
  EngineResponse,
  Files,
} from "./protocol.ts"

type Request = EngineRequest extends infer R
  ? R extends EngineRequest
    ? Omit<R, "id">
    : never
  : never

export type Engine = {
  readonly version: string
  /** Resolves once the engine has started; rejects when it cannot. */
  readonly ready: Promise<void>
  /** The configuration module as CommonJS. */
  config: (source: string) => Promise<string>
  compile: (config: unknown, files: Files) => Promise<CompileOutput>
  dispose: () => void
}

export function startEngine(version: string): Engine {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  })
  const pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >()
  let next = 0
  worker.addEventListener("message", (event: MessageEvent<EngineResponse>) => {
    const response = event.data
    const waiting = pending.get(response.id)
    pending.delete(response.id)
    if (!waiting) return
    if (response.ok) waiting.resolve(response.value)
    else waiting.reject(new Error(response.error))
  })
  worker.addEventListener("error", (event) => {
    for (const waiting of pending.values())
      waiting.reject(new Error(event.message || "the engine worker failed"))
    pending.clear()
  })
  const send = <T>(request: Request): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = next++
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      worker.postMessage({ ...request, id })
    })
  const ready = send<string>({ type: "load", version }).then(() => undefined)
  return {
    version,
    ready,
    config: (source) => send<string>({ type: "config", source }),
    compile: (config, files) =>
      ready.then(() => send<CompileOutput>({ type: "compile", config, files })),
    dispose: () => worker.terminate(),
  }
}
