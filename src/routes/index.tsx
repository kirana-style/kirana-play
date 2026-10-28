import { createFileRoute } from "@tanstack/react-router"

import { Playground } from "@/playground/Playground.tsx"

// Client only: the editor, the engine worker and the preview frame are all
// browser things, and the project comes from the link's fragment, which the
// server never sees.
export const Route = createFileRoute("/")({
  ssr: false,
  component: Playground,
})
