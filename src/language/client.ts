/**
 * The page's side of the TypeScript worker: started on the first request, so
 * a page that never edits never loads TypeScript, and a promise per request.
 */
import type { Files } from "@/engine/protocol.ts"

import type {
  Completions,
  Details,
  Hover,
  LanguageRequest,
  LanguageResponse,
} from "./protocol.ts"

type Request = LanguageRequest extends infer R
  ? R extends LanguageRequest
    ? Omit<R, "id">
    : never
  : never

export type TypeScript = {
  /** The project's files, so imports between them resolve. */
  sync: (files: Files) => void
  completions: (
    file: string,
    code: string,
    offset: number
  ) => Promise<Completions>
  details: (
    file: string,
    code: string,
    offset: number,
    entry: { name: string; source?: string; data?: unknown }
  ) => Promise<Details | null>
  hover: (file: string, code: string, offset: number) => Promise<Hover | null>
}

export function startTypeScript(): TypeScript {
  let worker: Worker | undefined
  let files: Files = {}
  const pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >()
  let next = 0

  const started = () => {
    if (worker) return worker
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    })
    worker.addEventListener(
      "message",
      (event: MessageEvent<LanguageResponse>) => {
        const response = event.data
        const waiting = pending.get(response.id)
        pending.delete(response.id)
        if (!waiting) return
        if (response.ok) waiting.resolve(response.value)
        else waiting.reject(new Error(response.error))
      }
    )
    worker.addEventListener("error", (event) => {
      for (const waiting of pending.values())
        waiting.reject(
          new Error(event.message || "the TypeScript worker failed")
        )
      pending.clear()
    })
    worker.postMessage({ id: next++, type: "sync", files })
    return worker
  }

  const send = <T>(request: Request): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = next++
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      started().postMessage({ ...request, id })
    })

  return {
    sync: (latest) => {
      files = latest
      // Before the worker exists, the files wait for its first request.
      worker?.postMessage({ id: -1, type: "sync", files })
    },
    completions: (file, code, offset) =>
      send<Completions>({ type: "completions", file, code, offset }),
    details: (file, code, offset, entry) =>
      send<Details | null>({ type: "details", file, code, offset, ...entry }),
    hover: (file, code, offset) =>
      send<Hover | null>({ type: "hover", file, code, offset }),
  }
}
