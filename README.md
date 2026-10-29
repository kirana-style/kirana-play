# Kirana Play

The playground for [Kirana](https://kirana.style): type a component and read the CSS the compiler
writes for it, compiled in your browser by the released engine. It will answer at
[play.kirana.style](https://play.kirana.style).

- **A project, not a snippet:** components, tokens and `kirana.config.ts` in their own files,
  importing each other as on disk.
- **What the compiler says:** the stylesheet by layer with its size, each module as Kirana rewrites
  it, and the diagnostics in the gutter and under the editor, as the language server shows them.
- **A live preview**, in a sandboxed frame.
- **Any release** of Kirana with a browser engine, chosen in the footer.
- **Share** puts the whole project in the link's fragment: nothing is stored on a server.

## Running it

[Bun](https://bun.sh) and Node.js 22.18 or later; `vp` (Vite+) comes with `bun install`.

```bash
bun install
vp dev                 # http://localhost:3004
vp check               # format, lint, types
vp test                # unit tests
vp run prepush         # check, tests, then build: what CI runs
```

The browser test runs on the built Worker:

```bash
vp run build && bunx wrangler dev --port 8787 &
bun scripts/e2e.ts
```

To try a Kirana build that is not on npm yet, serve its packed `@kirana-style/compiler-browser`
(the unpacked tarball, with any static server) and point the engine proxy at it in `.dev.vars`,
which git ignores:

```bash
KIRANA_ENGINE_URL=http://127.0.0.1:4555/
```

## How it is built

```
page ──► engine worker ──► /engine/<version>/compiler.js (Kirana's WebAssembly engine)
  │        the project in its in-memory file system; Kirana's output, then Sucrase
  └────► preview frame (sandboxed, opaque origin)
           evaluates kirana.config.ts, runs the modules, renders app.tsx
```

| Path               | What it is                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `src/routes/`      | The playground page (client only) and the `/engine/*` route                                  |
| `src/playground/`  | The interface: files, editor pane, output pane, problems, header and footer                  |
| `src/ui/`          | Base UI components copied from the Kirana site's kit (`src/ui/README.md` says what changed)  |
| `src/editor/`      | CodeMirror, its theme and Kirana's diagnostics as lint marks                                 |
| `src/engine/`      | The engine worker and its client; the proxy that serves each version's files from npm        |
| `src/preview/`     | The preview frame's document, its script and its small CommonJS module system                |
| `src/start.ts`     | Cross-origin isolation on every page                                                         |
| `public/_headers`  | The same for the static files, and CORS for the frame's script                               |
| `vite.config.ts`   | The app's Vite setup (Cloudflare, Kirana, TanStack Start, React), the tasks, format and lint |
| `kirana.config.ts` | Kirana's configuration for the playground's own pages                                        |
| `wrangler.jsonc`   | The Cloudflare Worker `play`                                                                 |

- **The engine** is `@kirana-style/compiler-browser` at the version picked, fetched by the Worker
  from npm and served from this origin: the page is cross-origin isolated, which the engine's
  threads need, so nothing may come from another origin. The version it opens with is the one of
  `@kirana-style/*` in `package.json`.
- **A project's code never runs on this origin.** The configuration and the modules run in a frame
  sandboxed without `allow-same-origin`, which gives it an opaque origin.
- **Styling is Kirana**, except CodeMirror's own parts, which CodeMirror's theme extension styles
  (`src/editor/theme.ts`) with the brand's `light-dark()` pairs.

The compiler itself lives in [kirana-style/kirana](https://github.com/kirana-style/kirana).

## License

[MIT](LICENSE)
