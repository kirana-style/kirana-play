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

import type { KiranaCompletion, Place, Summary } from "@/engine/protocol.ts"

export type KiranaHover = (
  file: string,
  line: number,
  character: number
) => Promise<string | null>

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

/** Paragraphs, bold and code spans of the hover's markdown, as text nodes. */
function inline(text: string, parent: HTMLElement) {
  // Links name commands this page cannot run: their text is kept.
  const plain = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  for (const piece of plain.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/)) {
    if (!piece) continue
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
  const lines = source.replace(/<br>/g, "\n").split("\n")
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
      for (; index < lines.length && lines[index]!.startsWith("|"); index++) {
        const cells = lines[index]!.slice(1, -1).split("|")
        if (!tables || cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell)))
          continue
        const row = table.insertRow()
        for (const cell of cells) inline(cell.trim(), row.insertCell())
      }
      index--
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
          pos - line.from
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
