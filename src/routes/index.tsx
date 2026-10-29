import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"

// Client only: the editor, the engine worker and the preview frame are all
// browser things, and the project comes from the link's fragment, which the
// server never sees. The server build leaves the playground out entirely:
// Vite emits the workers of every module a build includes, so including it
// would put TypeScript and the engine's worker into the deployed Worker.
export const Route = createFileRoute("/")({
  ssr: false,
  component: import.meta.env.SSR
    ? () => null
    : lazyRouteComponent(
        () => import("@/playground/playground.tsx"),
        "Playground"
      ),
})
