/**
 * Kirana's language server in the editor, as VS Code shows it: after
 * `sx={…}` the summary of what the element receives (`grid · gap 1rem`), above
 * a `css()` or `recipe()` its counts and how many elements use it, and on a
 * style the hover with its resolved properties, a swatch beside each colour,
 * and completions TypeScript cannot give (condition keys, `select.`). The
 * summary, lenses, swatches and quick fixes come with each compile
 * (`summaries` in the engine's output); the hover and completions are asked
 * for when they are needed.
 */
import { snippet } from "@codemirror/autocomplete"
import type {
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from "@codemirror/autocomplete"
import { StateEffect, StateField } from "@codemirror/state"
import type { Extension, Text } from "@codemirror/state"
import {
  Decoration,
  EditorView,
  hoverTooltip,
  WidgetType,
} from "@codemirror/view"
import type { DecorationSet } from "@codemirror/view"

import type {
  KiranaCompletion,
  Place,
  Summary,
  Theme,
} from "@/engine/protocol.ts"

export type KiranaHover = (
  file: string,
  line: number,
  character: number,
  theme: Theme
) => Promise<string | null>

/** The scheme the page shows: the one picked, or the system's. */
function pageTheme(): Theme {
  const picked = document.documentElement.dataset.scheme
  if (picked === "light" || picked === "dark") return picked
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export type KiranaComplete = (
  file: string,
  code: string,
  line: number,
  character: number
) => Promise<KiranaCompletion[]>

/** A place from the language server as an offset in `doc`, clamped to it. */
export function offsetOf(doc: Text, place: Place): number {
  const line = doc.line(Math.min(place.line + 1, doc.lines))
  return Math.min(line.from + place.character, line.to)
}

class HintWidget extends WidgetType {
  constructor(readonly parts: Summary["hints"][number]["parts"]) {
    super()
  }
  override eq(other: HintWidget) {
    return JSON.stringify(other.parts) === JSON.stringify(this.parts)
  }
  toDOM() {
    const dom = document.createElement("span")
    dom.className = "cm-kirana-hint"
    dom.setAttribute("aria-hidden", "true")
    this.parts.forEach((part, index) => {
      if (index > 0) dom.append(" · ")
      const span = document.createElement("span")
      span.textContent = part.text
      if (part.group) span.className = `cm-kirana-${part.group}`
      dom.append(span)
    })
    return dom
  }
  override ignoreEvent() {
    return true
  }
}

class LensWidget extends WidgetType {
  constructor(
    readonly titles: string[],
    readonly indent: string,
    readonly open: () => void
  ) {
    super()
  }
  override eq(other: LensWidget) {
    return (
      other.titles.join("|") === this.titles.join("|") &&
      other.indent === this.indent
    )
  }
  toDOM() {
    const dom = document.createElement("div")
    dom.className = "cm-kirana-lens"
    // Kept to the line it sits above, as an editor draws a code lens.
    dom.style.paddingInlineStart = `${this.indent.length}ch`
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = this.titles.join(" | ")
    button.title = "Show the compiled CSS"
    button.addEventListener("click", this.open)
    dom.append(button)
    return dom
  }
  override ignoreEvent() {
    return true
  }
}

class SwatchWidget extends WidgetType {
  constructor(readonly colour: string) {
    super()
  }
  override eq(other: SwatchWidget) {
    return other.colour === this.colour
  }
  toDOM() {
    const dom = document.createElement("span")
    dom.className = "cm-kirana-swatch"
    dom.setAttribute("aria-hidden", "true")
    dom.style.backgroundColor = this.colour
    return dom
  }
}

/** A summary for the text on screen; null clears it. */
export const setSummary = StateEffect.define<Summary | null>()

function decorations(doc: Text, summary: Summary, open: () => void) {
  const ranges = summary.hints.map((hint) =>
    Decoration.widget({
      widget: new HintWidget(hint.parts),
      side: 1,
    }).range(offsetOf(doc, hint))
  )
  const byLine = new Map<number, string[]>()
  for (const lens of summary.lenses) {
    const titles = byLine.get(lens.line) ?? []
    titles.push(lens.title)
    byLine.set(lens.line, titles)
  }
  for (const [line, titles] of byLine) {
    const at = doc.line(Math.min(line + 1, doc.lines))
    const indent = /^\s*/.exec(at.text)![0]
    ranges.push(
      Decoration.widget({
        widget: new LensWidget(titles, indent, open),
        block: true,
        side: -1,
      }).range(at.from)
    )
  }
  for (const swatch of summary.swatches)
    ranges.push(
      Decoration.widget({
        widget: new SwatchWidget(swatch.css),
        side: -1,
      }).range(offsetOf(doc, swatch))
    )
  return Decoration.set(ranges, true)
}

/** An LSP snippet (`$1`, `${1:state}`) as CodeMirror writes one (`${}`, `${state}`). */
const snippetOf = (text: string) =>
  text.replace(/\$\{\d+:([^}]*)\}/g, "${$1}").replace(/\$\d+/g, "${}")

/** LSP's item kinds, as CodeMirror's completion icons name them. */
const KINDS: Record<number, string> = {
  2: "method",
  10: "property",
  14: "keyword",
}

/** Kirana's completions, inside a string or after `select.`. */
export function kiranaCompletions(options: {
  file: () => string
  complete: () => KiranaComplete | undefined
}): CompletionSource {
  return async (
    context: CompletionContext
  ): Promise<CompletionResult | null> => {
    const complete = options.complete()
    if (!complete) return null
    const line = context.state.doc.lineAt(context.pos)
    const before = line.text.slice(0, context.pos - line.from)
    const inString = (quote: string) => before.split(quote).length % 2 === 0
    if (!inString('"') && !inString("'") && !/select\.\w*$/.test(before))
      return null
    const items = await complete(
      options.file(),
      context.state.doc.toString(),
      line.number - 1,
      context.pos - line.from
    ).catch(() => [])
    if (context.aborted || items.length === 0) return null
    const doc = context.state.doc
    return {
      from: offsetOf(doc, items[0]!.from),
      to: offsetOf(doc, items[0]!.to),
      options: items.map((item) => ({
        label: item.label,
        detail: item.detail,
        type: KINDS[item.kind ?? 0],
        apply: item.snippet ? snippet(snippetOf(item.insert)) : item.insert,
        // Kirana's sortText ranks the common pseudo-classes first.
        sortText: item.sortText,
      })),
      validFor: /^[^"'`]*$/,
    }
  }
}

/**
 * The pieces of inline markdown a hover writes: an image, a coloured span (the
 * safe HTML VS Code allows), a line break, code, bold and italics.
 */
const INLINE =
  /(!\[[^\]]*\]\([^)\s]+\)|<span style="color:[^";]+;?">[^<]*<\/span>|<br\s*\/?>|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/

/** An image the page may show: drawn by the language server, so on this origin. */
const IMAGE = /^data:image\/(?:svg\+xml|png);base64,[\w+/=]+$/

/** A colour a span may take: a literal, or a variable the editor's theme sets. */
const COLOUR = /^(?:#[\da-f]{3,8}|var\(--[\w-]+\))$/i

/** A hover's inline markdown, as elements: nothing it holds is parsed as HTML. */
function inline(text: string, parent: HTMLElement) {
  // Links name commands or files this page cannot open: their text is kept.
  const plain = text.replace(/(?<!!)\[([^\]]*)\]\([^)]*\)/g, "$1")
  for (const piece of plain.split(INLINE)) {
    if (!piece) continue
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(piece)
    if (image) {
      if (!IMAGE.test(image[2]!)) continue
      const img = document.createElement("img")
      img.alt = image[1]!
      img.src = image[2]!
      parent.append(img)
      continue
    }
    const span = /^<span style="color:([^";]+);?">([^<]*)<\/span>$/.exec(piece)
    if (span) {
      const node = document.createElement("span")
      if (COLOUR.test(span[1]!.trim())) node.style.color = span[1]!.trim()
      node.textContent = span[2]!
      parent.append(node)
      continue
    }
    if (/^<br\s*\/?>$/.test(piece)) {
      parent.append(document.createElement("br"))
      continue
    }
    const tag = piece.startsWith("`")
      ? "code"
      : piece.startsWith("**")
        ? "strong"
        : piece.startsWith("*")
          ? "em"
          : undefined
    if (!tag) {
      parent.append(piece)
      continue
    }
    const node = document.createElement(tag)
    node.textContent = piece.replace(/^(`|\*\*|\*)|(`|\*\*|\*)$/g, "")
    parent.append(node)
  }
}

/** A table row's cells: split at each `|` not escaped, `\|` read as a bar. */
function cellsOf(row: string): string[] {
  return row
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim())
}

/**
 * A hover's markdown: paragraphs, fenced code and tables, nothing else.
 * TypeScript's documentation renders here too, without its tables (csstype's
 * browser-support grid says nothing a hover needs).
 */
export function markdown(
  source: string,
  { className = "cm-kirana-hover", tables = true } = {}
): HTMLElement {
  const dom = document.createElement("div")
  dom.className = className
  const lines = source.split("\n")
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    if (line.startsWith("```")) {
      const pre = document.createElement("pre")
      const body: string[] = []
      while (++index < lines.length && !lines[index]!.startsWith("```"))
        body.push(lines[index]!)
      pre.textContent = body.join("\n")
      dom.append(pre)
    } else if (line.startsWith("|")) {
      const table = document.createElement("table")
      const rows: string[][] = []
      for (; index < lines.length && lines[index]!.startsWith("|"); index++)
        rows.push(cellsOf(lines[index]!))
      index--
      // A header is the row above the `|:--|` line.
      const rule = rows.findIndex((cells) =>
        cells.every((cell) => /^:?-+:?$/.test(cell))
      )
      if (tables) {
        rows.forEach((cells, at) => {
          if (at === rule) return
          const row = table.insertRow()
          for (const cell of cells) {
            const node = document.createElement(at < rule ? "th" : "td")
            inline(cell, node)
            row.append(node)
          }
        })
      }
      if (table.rows.length) dom.append(table)
    } else if (line.trim()) {
      const paragraph = document.createElement("p")
      inline(line, paragraph)
      dom.append(paragraph)
    }
  }
  return dom
}

export function kiranaSupport(options: {
  file: () => string
  hover: () => KiranaHover | undefined
  open: () => void
}): Extension {
  const field = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(value, transaction) {
      let next = value.map(transaction.changes)
      for (const effect of transaction.effects)
        if (effect.is(setSummary))
          next = effect.value
            ? decorations(transaction.state.doc, effect.value, options.open)
            : Decoration.none
      return next
    },
    provide: (self) => EditorView.decorations.from(self),
  })

  return [
    field,
    hoverTooltip(
      async (view, pos) => {
        const hover = options.hover()
        if (!hover) return null
        const line = view.state.doc.lineAt(pos)
        const text = await hover(
          options.file(),
          line.number - 1,
          pos - line.from,
          pageTheme()
        ).catch(() => null)
        if (!text) return null
        return {
          pos,
          above: true,
          create: () => ({ dom: markdown(text) }),
        }
      },
      { hoverTime: 350 }
    ),
  ]
}
