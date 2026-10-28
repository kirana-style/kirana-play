/**
 * The stylesheet's layers, for the CSS pane's filter: Kirana writes every rule
 * into a named layer (`kirana.tokens`, `kirana.atoms`, …), so a layer's block
 * is one place to read.
 */

export type Layer = { name: string; css: string }

/** Where the block that opens at `open` (a `{`) closes, past strings and comments. */
function closing(css: string, open: number): number {
  let depth = 0
  for (let at = open; at < css.length; at++) {
    const char = css[at]
    if (char === '"' || char === "'") {
      at++
      while (at < css.length && css[at] !== char) at += css[at] === "\\" ? 2 : 1
    } else if (char === "/" && css[at + 1] === "*") {
      const end = css.indexOf("*/", at + 2)
      at = end < 0 ? css.length : end + 1
    } else if (char === "{") depth++
    else if (char === "}" && --depth === 0) return at
  }
  return css.length - 1
}

/** Each top-level `@layer <name> { … }` block, in order; a layer written twice is joined. */
export function layersOf(css: string): Layer[] {
  const layers = new Map<string, string[]>()
  const block = /@layer\s+([\w.-]+)\s*\{/g
  let match: RegExpExecArray | null
  while ((match = block.exec(css))) {
    const open = match.index + match[0].length - 1
    const end = closing(css, open)
    const name = match[1]!
    layers.set(name, [
      ...(layers.get(name) ?? []),
      css.slice(match.index, end + 1),
    ])
    block.lastIndex = end + 1
  }
  return [...layers].map(([name, blocks]) => ({ name, css: blocks.join("\n") }))
}

/** A byte count as people read it. */
export function formatBytes(bytes: number): string {
  return bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(2)} kB`
}
