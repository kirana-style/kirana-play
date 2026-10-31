/**
 * Kirana's language server in the editor, as VS Code shows it: after
 * `sx={…}` the summary of what the element receives (`grid · gap 1rem`), above
 * a `css()` or `recipe()` its counts and how many elements use it, and on a
 * style the hover with its resolved properties. The summary and the lenses
 * come with each compile (`summaries` in the engine's output); the hover is
 * asked for when the pointer rests.
 */
import { StateEffect, StateField } from "@codemirror/state"
import type { Extension, Text } from "@codemirror/state"
import {
  Decoration,
  EditorView,
  hoverTooltip,
  WidgetType,
} from "@codemirror/view"
import type { DecorationSet } from "@codemirror/view"

import type { Place, Summary } from "@/engine/protocol.ts"

export type KiranaHover = (
  file: string,
  line: number,
  character: number
) => Promise<string | null>

/** A place from the language server as an offset in `doc`, clamped to it. */
function offsetOf(doc: Text, place: Place): number {
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
  return Decoration.set(ranges, true)
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

/** The hover's markdown: paragraphs, fenced code and tables, nothing else. */
function markdown(source: string): HTMLElement {
  const dom = document.createElement("div")
  dom.className = "cm-kirana-hover"
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
        if (cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell))) continue
        const row = table.insertRow()
        for (const cell of cells) inline(cell.trim(), row.insertCell())
      }
      index--
      dom.append(table)
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
