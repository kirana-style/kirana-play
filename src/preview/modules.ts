/**
 * A small CommonJS module system for the preview: the project's modules by
 * path, the packages the frame carries by name, and relative imports resolved
 * as a bundler would (`./Card` finds `Card.tsx`).
 */

const EXTENSIONS = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"]

/** `specifier` from the module at `from`, as a path relative to the project root. */
export function resolvePath(from: string, specifier: string): string {
  const segments = from.split("/").slice(0, -1)
  for (const segment of specifier.split("/")) {
    if (segment === "" || segment === ".") continue
    if (segment === "..") segments.pop()
    else segments.push(segment)
  }
  return segments.join("/")
}

export type Registry = {
  /** Runs `file` once and returns its exports. */
  require: (file: string) => Record<string, unknown>
}

/**
 * Modules are evaluated with `new Function`, inside the sandboxed frame: the
 * code is the user's, and the frame's opaque origin keeps it away from the page.
 */
export function createRegistry(
  modules: Readonly<Record<string, string>>,
  packages: Readonly<Record<string, unknown>>
): Registry {
  const cache = new Map<string, { exports: Record<string, unknown> }>()

  const load = (file: string): Record<string, unknown> => {
    const done = cache.get(file)
    if (done) return done.exports
    const record = { exports: {} as Record<string, unknown> }
    cache.set(file, record)
    const run = new Function("require", "module", "exports", modules[file]!)
    run(
      (specifier: string) => requireFrom(file, specifier),
      record,
      record.exports
    )
    return record.exports
  }

  const requireFrom = (from: string, specifier: string): unknown => {
    if (!specifier.startsWith(".")) {
      if (specifier in packages) return packages[specifier]
      throw new Error(
        `${from}: the preview has no package "${specifier}" (it carries ${Object.keys(packages).join(", ")})`
      )
    }
    const path = resolvePath(from, specifier)
    const found = EXTENSIONS.map((extension) => path + extension).find(
      (candidate) => candidate in modules
    )
    if (found === undefined)
      throw new Error(
        `${from}: cannot find "${specifier}" among the project's files`
      )
    return load(found)
  }

  return { require: load }
}
