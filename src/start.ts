import { createMiddleware, createStart } from "@tanstack/react-start"

/**
 * Every page is cross-origin isolated: the engine's WebAssembly memory is a
 * SharedArrayBuffer, which a page may only create when isolated. The static
 * files get the same headers from `public/_headers`.
 */
const isolation = createMiddleware().server(async ({ next }) => {
  const result = await next()
  const headers = result.response.headers
  if (!headers.has("Cross-Origin-Opener-Policy"))
    headers.set("Cross-Origin-Opener-Policy", "same-origin")
  if (!headers.has("Cross-Origin-Embedder-Policy"))
    headers.set("Cross-Origin-Embedder-Policy", "require-corp")
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [isolation],
}))
