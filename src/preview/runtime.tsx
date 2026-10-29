/**
 * The preview frame's script. It runs in a sandboxed `srcdoc` frame without
 * `allow-same-origin`, so the project's code, which a shared link brings, runs
 * on an opaque origin and never on the playground's. It carries React and
 * loads Kirana's runtime from the engine release the page compiled with.
 */
import { Component } from "react"
import type { ReactNode } from "react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as ReactDOMClient from "react-dom/client"
import * as jsxRuntime from "react/jsx-runtime"

import { createRegistry } from "./modules.ts"
import type { FromFrame, ToFrame } from "./protocol.ts"

const PACKAGES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOMClient,
  // What a configuration imports. Modules import nothing else from Kirana at
  // run time: the compiler removes their `@kirana-style/core` imports.
  "@kirana-style/core/config": { defineConfig: (config: unknown) => config },
}

const send = (message: FromFrame) => window.parent.postMessage(message, "*")

class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  override state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override componentDidCatch(error: Error) {
    send({ type: "error", message: error.message })
  }
  override render() {
    return this.state.error ? null : this.props.children
  }
}

let root: ReactDOMClient.Root | undefined
const runtimes = new Map<string, Promise<unknown>>()

/** Kirana's runtime for the engine that compiled the modules, loaded once per version. */
function runtime(url: string): Promise<unknown> {
  let loading = runtimes.get(url)
  if (!loading) {
    loading = import(/* @vite-ignore */ url)
    runtimes.set(url, loading)
  }
  return loading
}

function setScheme(scheme: "light" | "dark" | "system") {
  document.documentElement.style.colorScheme =
    scheme === "system" ? "light dark" : scheme
}

async function render(message: Extract<ToFrame, { type: "render" }>) {
  try {
    const internal = await runtime(message.runtime)
    document.getElementById("kirana")!.textContent = message.css
    const registry = createRegistry(message.modules, {
      ...PACKAGES,
      "@kirana-style/core/internal": internal,
    })
    const entry = registry.require(message.entry)
    const App = entry.default as React.ComponentType | undefined
    if (typeof App !== "function")
      throw new Error(`${message.entry} has no default export to render`)
    root ??= ReactDOMClient.createRoot(document.getElementById("root")!)
    root.render(
      // A new boundary per render, so an error clears once the code is fixed.
      <Boundary key={Math.random()}>
        <App />
      </Boundary>
    )
    send({ type: "rendered" })
  } catch (error) {
    root?.render(null)
    send({ type: "error", message: (error as Error).message })
  }
}

function evaluateConfig(id: number, code: string) {
  try {
    const loaded = createRegistry(
      { "kirana.config.ts": code },
      PACKAGES
    ).require("kirana.config.ts")
    // Structured cloning drops nothing silently: a function in it throws here.
    const value = structuredClone(loaded.default ?? {})
    send({ type: "config", id, ok: true, value })
  } catch (error) {
    send({
      type: "config",
      id,
      ok: false,
      error:
        error instanceof DOMException && error.name === "DataCloneError"
          ? "the configuration must be plain data: the playground cannot pass functions to the engine"
          : (error as Error).message,
    })
  }
}

window.addEventListener("message", (event: MessageEvent<ToFrame>) => {
  if (event.source !== window.parent) return
  const message = event.data
  if (message.type === "render") void render(message)
  else if (message.type === "config") evaluateConfig(message.id, message.code)
  else setScheme(message.scheme)
})
window.addEventListener("error", (event) =>
  send({ type: "error", message: event.message })
)
window.addEventListener("unhandledrejection", (event) =>
  send({
    type: "error",
    message: String((event.reason as Error)?.message ?? event.reason),
  })
)
send({ type: "ready" })
