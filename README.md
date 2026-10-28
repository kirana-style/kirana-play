# Kirana Play

The playground for [Kirana](https://kirana.style): type a component and read the CSS the compiler
writes for it, compiled in your browser by the released engine. It will answer at
[play.kirana.style](https://play.kirana.style).

**Status:** being built. Today the page says so and links to
[the examples on kirana.style](https://kirana.style/play).

## Running it

[Bun](https://bun.sh) and Node.js 22.18 or later; `vp` (Vite+) comes with `bun install`.

```bash
bun install
vp dev                 # http://localhost:3004
vp check               # format, lint, types
vp run prepush         # check, then build: what CI runs
```

## How it is built

| Path               | What it is                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `src/routes/`      | The pages (TanStack Start)                                                                   |
| `vite.config.ts`   | The app's Vite setup (Cloudflare, Kirana, TanStack Start, React), the tasks, format and lint |
| `kirana.config.ts` | Kirana's configuration for the playground's own pages                                        |
| `wrangler.jsonc`   | The Cloudflare Worker `play`                                                                 |
| `public/_headers`  | Cross-origin isolation, which the engine's threaded WebAssembly build needs                  |

Kirana comes from npm at one exact release, so the playground compiles exactly what users install.
The compiler itself lives in [kirana-style/kirana](https://github.com/kirana-style/kirana).

## License

[MIT](LICENSE)
