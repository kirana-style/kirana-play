/**
 * The engine's files, served from this origin: the page is cross-origin
 * isolated, so the WebAssembly engine, its worker and its runtime must come
 * from here, and the preview frame (an opaque origin) reads the runtime with
 * CORS. Each version's files are immutable on npm, so they are cached for good.
 */
import { env } from "cloudflare:workers"

import { compareVersions } from "./versions.ts"

const PACKAGE = "@kirana-style/compiler-browser"
/** The first release with a browser engine: the 0.0.0 that reserved the name has none. */
const FIRST = "0.3.5"
const VERSION = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/
const FILE = /^[\w-]+(?:\.[\w-]+)*\.(?:js|mjs|wasm)$/
const TYPES: Record<string, string> = {
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  wasm: "application/wasm",
}

/** Readable by the preview frame and by any page that embeds the playground. */
const SHARED = {
  "Access-Control-Allow-Origin": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
}

async function cached(
  request: Request,
  make: () => Promise<Response>
): Promise<Response> {
  const cache = typeof caches === "undefined" ? undefined : caches.default
  const hit = await cache?.match(request)
  // A cached response's headers are immutable, and the isolation middleware
  // (`src/start.ts`) still sets its own: hand it a copy.
  if (hit) return new Response(hit.body, hit)
  const response = await make()
  if (response.ok && cache) await cache.put(request, response.clone())
  return response
}

/** `/engine/<version>/<file>`: one file of the engine package at one version. */
export async function engineFile(
  request: Request,
  version: string,
  file: string
): Promise<Response> {
  if (!VERSION.test(version) || !FILE.test(file))
    return new Response("Not found", { status: 404, headers: SHARED })
  const local = env.KIRANA_ENGINE_URL
  const upstream = local
    ? new URL(file, local.endsWith("/") ? local : `${local}/`)
    : `https://cdn.jsdelivr.net/npm/${PACKAGE}@${version}/${file}`
  const make = async () => {
    const response = await fetch(upstream)
    if (!response.ok)
      return new Response(`${PACKAGE}@${version} has no ${file}`, {
        status: response.status === 404 ? 404 : 502,
        headers: SHARED,
      })
    return new Response(response.body, {
      headers: {
        ...SHARED,
        "Content-Type": TYPES[file.slice(file.lastIndexOf(".") + 1)]!,
        "Cache-Control": local
          ? "no-store"
          : "public, max-age=31536000, immutable",
      },
    })
  }
  return local ? make() : cached(request, make)
}

/** `/engine/versions`: the versions on npm that have a browser engine, newest first. */
export async function engineVersions(
  request: Request,
  fallback: string
): Promise<Response> {
  const json = (versions: string[]) =>
    Response.json(
      { versions },
      { headers: { ...SHARED, "Cache-Control": "public, max-age=600" } }
    )
  if (env.KIRANA_ENGINE_URL) return json([fallback])
  return cached(request, async () => {
    const response = await fetch(`https://registry.npmjs.org/${PACKAGE}`, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    })
    if (!response.ok) return json([fallback])
    const { versions = {} } = (await response.json()) as {
      versions?: Record<string, unknown>
    }
    return json(
      Object.keys(versions)
        .filter(
          (version) =>
            VERSION.test(version) && compareVersions(version, FIRST) >= 0
        )
        .sort(compareVersions)
        .reverse()
    )
  })
}
