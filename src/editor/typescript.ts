/**
 * TypeScript in the editor: completion as you type (after a letter, a dot or
 * inside quotes, where a string union such as a CSS value offers its members)
 * and on Ctrl+Space, and a tooltip with the type of what the pointer rests on.
 * The answers come from the TypeScript worker (`src/language/`).
 */
import { autocompletion } from "@codemirror/autocomplete"
import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from "@codemirror/autocomplete"
import type { Extension } from "@codemirror/state"
import { hoverTooltip } from "@codemirror/view"

import type { TypeScript } from "@/language/client.ts"
import type { Part } from "@/language/protocol.ts"

import { markdown } from "./kirana.ts"

/** TypeScript's element kinds, as CodeMirror's completion icons name them. */
function typeOf(kind: string): string | undefined {
  switch (kind) {
    case "property":
    case "getter":
    case "setter":
      return "property"
    case "method":
      return "method"
    case "function":
    case "local function":
      return "function"
    case "const":
      return "constant"
    case "let":
    case "var":
    case "local var":
    case "parameter":
      return "variable"
    case "class":
      return "class"
    case "interface":
    case "type":
    case "type parameter":
      return "type"
    case "enum":
      return "enum"
    case "keyword":
      return "keyword"
    case "module":
    case "external module name":
      return "namespace"
    case "string":
      return "text"
    default:
      return undefined
  }
}

/** A signature, each part in the colour the editor gives its kind of name. */
function signature(parts: Part[]): HTMLElement {
  const code = document.createElement("code")
  code.className = "cm-ts-signature"
  for (const part of parts) {
    const span = document.createElement("span")
    span.textContent = part.text
    span.className = `cm-ts-${part.kind}`
    code.append(span)
  }
  return code
}

function card(parts: Part[], documentation: string): HTMLElement {
  const dom = document.createElement("div")
  dom.className = "cm-ts-info"
  dom.append(signature(parts))
  if (documentation)
    dom.append(
      markdown(documentation, { className: "cm-ts-doc", tables: false })
    )
  return dom
}

/**
 * The order an option takes, as VS Code orders TypeScript's: by its
 * `sortText` (a deprecated entry's starts with `z`, so it comes last), then by
 * name. A property's string values come first; among them the lowercase CSS
 * keywords before the capitalised system colours (`AccentColor`), and a
 * vendor-prefixed one (`-webkit-box`) last.
 */
function rank(entry: {
  name: string
  sortText: string
  quoted?: boolean
  kind: string
}): string {
  const value = entry.quoted || entry.kind === "string"
  const group = !value
    ? ""
    : entry.name.startsWith("-")
      ? "2"
      : /^[A-Z]/.test(entry.name)
        ? "1"
        : "0"
  return `${entry.quoted ? "0" : "1"}${entry.sortText}${group}${entry.name.toLowerCase()}`
}

/** The options TypeScript marks deprecated, drawn struck through. */
const deprecated = new WeakSet<Completion>()

export function typescriptSupport(
  service: TypeScript,
  file: () => string,
  /** Other sources whose completions share the list (Kirana's). */
  also: CompletionSource[] = []
): Extension {
  async function complete(
    context: CompletionContext
  ): Promise<CompletionResult | null> {
    const word = context.matchBefore(/[\w$-]*/)
    const before = context.state.sliceDoc(context.pos - 1, context.pos)
    // While typing, only after a name's first letter, a dot or a quote.
    if (!context.explicit && !word?.text && !/[."'/]/.test(before)) return null
    const code = context.state.doc.toString()
    const name = file()
    // At a property's value with no quote yet (`color: |`, `color: cu|`), the
    // values the property takes are asked for as well.
    const line = context.state.doc.lineAt(context.pos)
    const typed = line.text.slice(0, context.pos - line.from)
    const inString = ['"', "'", "`"].some(
      (quote) => typed.split(quote).length % 2 === 0
    )
    const atValue = !inString && /:\s*[\w$-]*$/.test(typed)
    const { entries } = await service.completions(
      name,
      code,
      context.pos,
      atValue ? (word?.from ?? context.pos) : undefined
    )
    if (context.aborted || entries.length === 0) return null
    const replace = entries.find(
      (entry) => entry.replace && !entry.quoted
    )?.replace
    const options: Completion[] = entries.map((entry) => ({
      label: entry.name,
      // A quoted value shows its quotes, and matches what is typed without them.
      displayLabel: entry.quoted ? JSON.stringify(entry.name) : undefined,
      type: typeOf(entry.kind),
      apply: entry.insertText ?? entry.name,
      sortText: rank(entry),
      info: entry.quoted
        ? undefined
        : async () => {
            const details = await service.details(
              name,
              code,
              context.pos,
              entry
            )
            return details
              ? card(details.signature, details.documentation)
              : null
          },
    }))
    for (const [index, entry] of entries.entries())
      if (entry.deprecated) deprecated.add(options[index]!)
    return {
      from: replace?.start ?? word?.from ?? context.pos,
      to: replace?.end,
      options,
      validFor: /^[\w$-]*$/,
    }
  }

  return [
    autocompletion({
      override: [complete, ...also],
      optionClass: (option) =>
        deprecated.has(option) ? "cm-completion-deprecated" : "",
    }),
    hoverTooltip(
      async (view, pos) => {
        const info = await service.hover(file(), view.state.doc.toString(), pos)
        if (!info || info.signature.length === 0) return null
        return {
          pos: info.start,
          end: info.end,
          above: true,
          create: () => ({ dom: card(info.signature, info.documentation) }),
        }
      },
      { hoverTime: 350 }
    ),
  ]
}
