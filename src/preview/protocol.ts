/** What the page and the sandboxed preview frame say to each other. */

export type Scheme = "light" | "dark" | "system"

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
