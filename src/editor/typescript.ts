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
} from "@codemirror/autocomplete"
import type { Extension } from "@codemirror/state"
import { hoverTooltip } from "@codemirror/view"

import type { TypeScript } from "@/language/client.ts"
import type { Part } from "@/language/protocol.ts"

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
  if (documentation) {
    const text = document.createElement("p")
    text.className = "cm-ts-doc"
    text.textContent = documentation
    dom.append(text)
  }
  return dom
}

export function typescriptSupport(
  service: TypeScript,
  file: () => string
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
    const { entries } = await service.completions(name, code, context.pos)
    if (context.aborted || entries.length === 0) return null
    const replace = entries.find((entry) => entry.replace)?.replace
    const options: Completion[] = entries.map((entry) => ({
      label: entry.name,
      type: typeOf(entry.kind),
      apply: entry.insertText ?? entry.name,
      // TypeScript ranks by sortText, lowest first ("11" before "15"); a
      // vendor-prefixed value (`-webkit-box`) goes after every other.
      boost: entry.name.startsWith("-")
        ? -99
        : -Math.min(Number.parseInt(entry.sortText, 10) || 0, 98),
      info: async () => {
        const details = await service.details(name, code, context.pos, entry)
        return details ? card(details.signature, details.documentation) : null
      },
    }))
    return {
      from: replace?.start ?? word?.from ?? context.pos,
      to: replace?.end,
      options,
      validFor: /^[\w$-]*$/,
    }
  }

  return [
    autocompletion({ override: [complete] }),
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
