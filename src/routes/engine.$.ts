import { createFileRoute } from "@tanstack/react-router"

import { engineFile, engineVersions } from "@/engine/proxy.ts"
import { DEFAULT_VERSION } from "@/engine/version.ts"

export const Route = createFileRoute("/engine/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const path = params._splat ?? ""
        if (path === "versions") return engineVersions(request, DEFAULT_VERSION)
        const [version = "", file = "", ...rest] = path.split("/")
        if (rest.length) return new Response("Not found", { status: 404 })
        return engineFile(request, version, file)
      },
    },
  },
})
