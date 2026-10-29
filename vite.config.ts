import { cloudflare } from "@cloudflare/vite-plugin"
import kirana from "@kirana-style/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, lazyPlugins } from "vite-plus"

/**
 * The sources a task reads, named rather than traced: tracing a task's file access makes starting
 * a native binary fail with EBUSY (tsgolint under `vp check`), as Kirana's repository found.
 */
const SOURCES = [
  "**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,json,jsonc,md,css,yml,yaml,html}",
  "!**/node_modules/**",
  "!**/dist/**",
  "!**/.tanstack/**",
  "!**/.wrangler/**",
  "!.agents/**",
  "!.claude/**",
  "bun.lock",
]

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // `vp run` reads the config to find its tasks; `lazyPlugins` keeps the plugins (and the native
  // engine Kirana's plugin opens) out of that read and in for every build, dev server and test.
  // Unit tests run none of them: they test plain modules, and the Cloudflare
  // plugin would turn the test run into a Worker.
  plugins: lazyPlugins(() =>
    process.env.VITEST
      ? []
      : [
          // First: it takes over the "ssr" environment before TanStack Start configures it, so the
          // server half runs in workerd, the runtime the `play` Worker uses (wrangler.jsonc).
          cloudflare({ viteEnvironment: { name: "ssr" } }),
          // Ahead of the framework plugins, so modules reach them already compiled.
          kirana(),
          tanstackStart({
            router: { quoteStyle: "double", semicolons: false },
          }),
          // The preview frame's script stays out of React Refresh: its wrapper
          // imports the module itself, and once a hot update has stamped that import
          // the frame runs two copies, two React roots on one element. The frame
          // reloads instead (`src/preview/runtime.tsx`).
          viteReact({ exclude: [/\/node_modules\//, /\/src\/preview\//] }),
        ]
  ),
  // The engine worker imports the engine with `import()`, and the preview
  // frame loads its script as a module: both need ES module workers.
  worker: { format: "es" },
  server: {
    port: 3004,
    // As in production (`public/_headers`, `src/start.ts`): the page is
    // cross-origin isolated, and the preview frame, an opaque origin, reads
    // its script and React with CORS.
    cors: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  build: {
    cssMinify: true,
    minify: true,
    sourcemap: true,
    // Kirana's browser floor, the first versions with `light-dark()`. Below it, the CSS minifier
    // rewrites `light-dark()` into switches nothing sets, and colours vanish in production only.
    cssTarget: ["chrome123", "safari17.5", "firefox120"],
  },
  // Unit tests: what runs without a browser (`vp test`). The playground in a
  // browser is `scripts/e2e.ts`.
  test: { include: ["test/**/*.test.ts"] },
  // The tasks: `vp run <name>`. `vp run prepush` is what the pre-push hook runs; CI runs the same.
  run: {
    tasks: {
      // Format, lint with the Kirana rules, and types. A warning fails it, as in CI.
      check: {
        command: "vp check --deny-warnings",
        cache: { input: SOURCES, output: [] },
      },
      // `build` is package.json's script: the Worker and its static files into dist/, where a
      // Kirana compiler error fails it.
      test: {
        command: "vp test run",
        cache: { input: SOURCES, output: [] },
      },
      prepush: {
        command: "echo All checks passed.",
        dependsOn: ["check", "test", "build"],
        cache: false,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    endOfLine: "lf",
    semi: false,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.output/**",
      "**/.nitro/**",
      "**/.tanstack/**",
      "**/.vinxi/**",
      "**/.wrangler/**",
      "**/routeTree.gen.ts",
      "bun.lock",
      ".agents/**",
      ".claude/**",
    ],
  },
  lint: {
    plugins: ["import", "typescript", "unicorn", "react", "oxc"],
    jsPlugins: [
      { name: "kirana", specifier: "@kirana-style/eslint-plugin" },
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
    ],
    categories: {
      correctness: "error",
    },
    env: {
      builtin: true,
      es2020: true,
      browser: true,
    },
    ignorePatterns: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.output/**",
      "**/.nitro/**",
      "**/.tanstack/**",
      "**/.vinxi/**",
      "**/.wrangler/**",
      "**/routeTree.gen.ts",
      "**/vite.config.*.timestamp-*.*",
    ],
    rules: {
      // Type-aware rules that only find deliberate patterns, turned off for the reasons the Kirana
      // repository gives: `String(value)` on bridged values and on `cx()`, which the compiler
      // replaces with a class string, and `useSyncExternalStore(store.subscribe, …)` members.
      "typescript/unbound-method": "off",
      "typescript/no-base-to-string": "off",
      "typescript/restrict-template-expressions": "off",
      "typescript/no-implied-eval": "off",
      "kirana/diagnostics": "error",
      "kirana/sx-last": "error",
      "kirana/no-conflicting-props": "error",
      "kirana/override-keeps-conditions": "error",
      "kirana/no-classname-on-sx": "error",
      "kirana/no-unused": "error",
      "for-direction": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-global-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      "no-shadow": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-var": "error",
      "no-with": "error",
      "prefer-const": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-commonjs": "error",
      "import/no-duplicates": "error",
      "unicorn/prefer-node-protocol": "error",
      // Files are kebab-case. TanStack Router's route names (`__root`,
      // `engine.$`) are its own syntax.
      "unicorn/filename-case": [
        "error",
        { case: "kebabCase", ignore: ["^(?:__root|.+\\.\\$)\\.tsx?$"] },
      ],
      "typescript/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": false,
          "ts-ignore": "allow-with-description",
        },
      ],
      "typescript/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "typescript/method-signature-style": ["error", "property"],
      "typescript/no-duplicate-enum-values": "error",
      "typescript/no-extra-non-null-assertion": "error",
      "typescript/no-inferrable-types": [
        "error",
        {
          ignoreParameters: true,
        },
      ],
      "typescript/no-misused-new": "error",
      "typescript/no-namespace": "error",
      "typescript/no-non-null-asserted-optional-chain": "error",
      "typescript/no-unsafe-function-type": "error",
      "typescript/no-wrapper-object-types": "error",
      "typescript/prefer-as-const": "error",
      "typescript/prefer-for-of": "error",
      "typescript/triple-slash-reference": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
