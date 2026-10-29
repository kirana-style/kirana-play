/** What the page and the sandboxed preview frame say to each other. */

export type Scheme = "light" | "dark" | "system"

/**
 * The packages the frame gives a project's modules (`runtime.tsx`). The
 * engine's in-memory project has no `node_modules`, so they are its
 * `externals`: an import from one is a runtime value, as Kirana's adapters
 * declare what their bundler provides.
 */
export const PREVIEW_PACKAGES = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
] as const

export type ToFrame =
  /** Evaluate the configuration module (CommonJS) and send back its default export. */
  | { type: "config"; id: number; code: string }
  /** Run the project: every module, then render the entry's default export. */
  | {
      type: "render"
      modules: Record<string, string>
      css: string
      entry: string
      runtime: string
    }
  | { type: "scheme"; scheme: Scheme }

export type FromFrame =
  | { type: "ready" }
  | { type: "config"; id: number; ok: true; value: unknown }
  | { type: "config"; id: number; ok: false; error: string }
  | { type: "rendered" }
  | { type: "error"; message: string }
