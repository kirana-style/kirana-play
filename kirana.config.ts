import { defineConfig } from "@kirana-style/core/config"

import { uiConfig } from "./src/ui/kirana.ts"

// The playground's own pages. The projects people type into the playground are compiled in the
// browser with their own configuration, never with this one.
export default defineConfig({
  // What the components in src/ui tell Kirana about Base UI.
  ...uiConfig,
  // The kit's reset (src/ui/reset.css) sits below every Kirana rule.
  layers: { before: ["reset"] },
  // The Workers runtime's own modules, which the server code imports.
  externals: ["cloudflare:"],
})
