import { useEffect, useRef } from "react"
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete"
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands"
import { css as cssLanguage } from "@codemirror/lang-css"
import { javascript } from "@codemirror/lang-javascript"
import { bracketMatching, indentOnInput } from "@codemirror/language"
import { lintGutter, lintKeymap, setDiagnostics } from "@codemirror/lint"
import type { Diagnostic as Lint } from "@codemirror/lint"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import { EditorState, Transaction } from "@codemirror/state"
import type { Extension, Text } from "@codemirror/state"
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  tooltips,
} from "@codemirror/view"
import { css } from "@kirana-style/core"

import type { Diagnostic, Position } from "@/engine/protocol.ts"
import type { TypeScript } from "@/language/client.ts"

import { editorTheme, highlighting } from "./theme.ts"
import { typescriptSupport } from "./typescript.ts"

export type Language = "tsx" | "ts" | "css"

export function languageOf(file: string): Language {
  if (file.endsWith(".css")) return "css"
  return file.endsWith(".ts") || file.endsWith(".mts") ? "ts" : "tsx"
}

function languageExtension(language: Language): Extension {
  if (language === "css") return cssLanguage()
  return javascript({ typescript: true, jsx: language === "tsx" })
}

/** An engine position as an offset in the document, clamped to it. */
function offsetOf(doc: Text, position: Position): number {
  const line = doc.line(Math.min(Math.max(position.line, 1), doc.lines))
  return Math.min(line.from + position.column - 1, line.to)
}

export function toLint(doc: Text, diagnostics: readonly Diagnostic[]): Lint[] {
  return diagnostics.flatMap((diagnostic) => {
    if (!diagnostic.start) return []
    const from = offsetOf(doc, diagnostic.start)
    const to = diagnostic.end
      ? Math.max(offsetOf(doc, diagnostic.end), from)
      : from
    const help = diagnostic.help.map((line) => `\nhelp: ${line}`).join("")
    return [
      {
        from,
        to,
        severity: diagnostic.severity,
        source: `${diagnostic.code} ${diagnostic.name}`,
        message: `${diagnostic.message}${help}`,
      },
    ]
  })
}

type Props = {
  /** Which document this is; each keeps its own history. */
  file: string
  value: string
  language: Language
  onChange?: (value: string) => void
  diagnostics?: readonly Diagnostic[]
  readOnly?: boolean
  label: string
  /** Moves the cursor here when it changes (a problem clicked in the list). */
  reveal?: Position & { at: number }
  /** TypeScript's completion and hovers, for a project's editable files. */
  typescript?: TypeScript
}

const styles = {
  root: css({ height: "100%", minHeight: 0, overflow: "hidden" }),
}

export function Editor({
  file,
  value,
  language,
  onChange,
  diagnostics,
  readOnly,
  label,
  reveal,
  typescript,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const states = useRef(new Map<string, EditorState>())
  const current = useRef(file)
  const change = useRef(onChange)
  change.current = onChange

  const create = (doc: string) =>
    EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        typescript && language !== "css" && !readOnly
          ? typescriptSupport(typescript, () => current.current)
          : autocompletion({ activateOnTyping: false }),
        highlightActiveLine(),
        highlightSelectionMatches(),
        lintGutter(),
        // In the body, so a hover card or the completion list is not clipped
        // by the pane; CodeMirror carries the theme's classes onto it.
        tooltips({ parent: document.body }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        languageExtension(language),
        highlighting,
        editorTheme,
        EditorView.contentAttributes.of({ "aria-label": label }),
        EditorState.tabSize.of(2),
        ...(readOnly
          ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
          : []),
        // Only what the person typed: a value written in from outside (an
        // example, a shared link) is not an edit of theirs.
        EditorView.updateListener.of((update) => {
          const typed = update.transactions.some(
            (transaction) =>
              transaction.docChanged &&
              !transaction.annotation(Transaction.remote)
          )
          if (typed) change.current?.(update.state.doc.toString())
        }),
      ],
    })

  useEffect(() => {
    const editor = new EditorView({
      state: create(value),
      parent: host.current!,
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
    // The view is made once; file and value changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Another file: keep this one's state (its undo history), show the other's.
  useEffect(() => {
    const editor = view.current
    if (!editor || current.current === file) return
    states.current.set(current.current, editor.state)
    current.current = file
    const kept = states.current.get(file)
    editor.setState(
      kept && kept.doc.toString() === value ? kept : create(value)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  // A value from outside (an example, a shared link, the compiler's output).
  useEffect(() => {
    const editor = view.current
    if (!editor || editor.state.doc.toString() === value) return
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      annotations: Transaction.remote.of(true),
    })
  }, [value])

  useEffect(() => {
    const editor = view.current
    if (!editor) return
    editor.dispatch(
      setDiagnostics(editor.state, toLint(editor.state.doc, diagnostics ?? []))
    )
  }, [diagnostics, value, file])

  useEffect(() => {
    const editor = view.current
    if (!editor || !reveal) return
    const at = offsetOf(editor.state.doc, reveal)
    editor.dispatch({ selection: { anchor: at }, scrollIntoView: true })
    editor.focus()
  }, [reveal])

  return <div ref={host} sx={styles.root} />
}
