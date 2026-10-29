/**
 * The page's side of the preview frame: its document, and requests to it.
 */
// Bundled on its own, as a worker is, but loaded by the frame as a module script.
// oxlint-disable-next-line import/default
import runtimeUrl from "./runtime.tsx?worker&url"
import type { FromFrame, Scheme, ToFrame } from "./protocol.ts"

/**
 * The frame's document. `sandbox="allow-scripts"` without `allow-same-origin`
 * gives it an opaque origin, so its script is loaded with CORS
 * (`public/_headers` lets it).
 */
export function frameDocument(): string {
  const script = new URL(runtimeUrl, location.href).href
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light dark; }
  html, body { margin: 0; min-height: 100%; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; padding: 1.5rem; box-sizing: border-box; background: light-dark(#fcfbf8, #110e0b); color: light-dark(#1a1510, #f5f2ec); }
</style>
<style id="kirana"></style>
<script>
  // In development the frame's script carries React Fast Refresh calls; the
  // frame reloads instead, so they do nothing. Nothing reads them in a build.
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
</script>
<script type="module" crossorigin src="${script}"></script>
</head>
<body><div id="root"></div></body>
</html>`
}

export type FrameEvents = {
  onRendered: () => void
  onError: (message: string) => void
}

export type Frame = {
  /** Resolves when the frame's script is running. */
  ready: Promise<void>
  /** Evaluates the configuration's CommonJS in the frame; resolves to its default export. */
  config: (code: string) => Promise<unknown>
  render: (message: Omit<Extract<ToFrame, { type: "render" }>, "type">) => void
  scheme: (scheme: Scheme) => void
  dispose: () => void
}

export function connectFrame(
  iframe: HTMLIFrameElement,
  events: FrameEvents
): Frame {
  let next = 0
  const waiting = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >()
  let markReady!: () => void
  const ready = new Promise<void>((resolve) => (markReady = resolve))
  const post = (message: ToFrame) =>
    iframe.contentWindow?.postMessage(message, "*")

  const listener = (event: MessageEvent<FromFrame>) => {
    if (event.source !== iframe.contentWindow) return
    const message = event.data
    switch (message.type) {
      case "ready":
        markReady()
        break
      case "config": {
        const request = waiting.get(message.id)
        waiting.delete(message.id)
        if (message.ok) request?.resolve(message.value)
        else request?.reject(new Error(message.error))
        break
      }
      case "rendered":
        events.onRendered()
        break
      case "error":
        events.onError(message.message)
    }
  }
  window.addEventListener("message", listener)

  return {
    ready,
    config: (code) =>
      ready.then(
        () =>
          new Promise((resolve, reject) => {
            const id = next++
            waiting.set(id, { resolve, reject })
            post({ type: "config", id, code })
          })
      ),
    render: (message) =>
      void ready.then(() => post({ type: "render", ...message })),
    scheme: (scheme) => void ready.then(() => post({ type: "scheme", scheme })),
    dispose: () => window.removeEventListener("message", listener),
  }
}
