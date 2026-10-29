/**
 * CodeMirror's look. CodeMirror styles its own parts (`.cm-*`) through its
 * theme extension, so this is the one place the playground's colours are not
 * written with `css()`: they are the brand's `light-dark()` pairs as literals,
 * and code is highlighted in GitHub's light and dark palettes, as everywhere
 * Kirana shows code.
 */
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { tags } from "@lezer/highlight"

const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const accent = "light-dark(oklch(0.5 0.09 185), oklch(0.82 0.1 185))"

export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "transparent",
    color: "inherit",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily:
      '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
    lineHeight: "1.65",
    fontVariantLigatures: "none",
    overflow: "auto",
  },
  ".cm-content": { paddingBlock: "0.75rem", caretColor: accent },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: accent,
    borderLeftWidth: "2px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: muted,
    border: "none",
    paddingInlineStart: "0.25rem",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "2.5ch",
    paddingInline: "0.5rem 0.75rem",
  },
  ".cm-activeLine": {
    backgroundColor:
      "light-dark(oklch(0.962 0.007 85 / 70%), oklch(0.25 0.01 70 / 50%))",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor:
        "light-dark(oklch(0.5 0.09 185 / 18%), oklch(0.82 0.1 185 / 22%))",
    },
  ".cm-matchingBracket": {
    backgroundColor:
      "light-dark(oklch(0.5 0.09 185 / 14%), oklch(0.82 0.1 185 / 18%))",
    outline: "none",
  },
  ".cm-tooltip": {
    border:
      "1px solid light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))",
    backgroundColor: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 8px 24px light-dark(oklch(0 0 0 / 10%), oklch(0 0 0 / 50%))",
  },
  ".cm-tooltip-lint": { maxWidth: "36rem" },
  ".cm-diagnostic": {
    fontFamily:
      '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
    fontSize: "12.5px",
    padding: "0.5rem 0.75rem",
    borderLeftWidth: "3px",
  },
  ".cm-diagnostic-error": {
    borderLeftColor: "light-dark(oklch(0.52 0.19 27), oklch(0.74 0.16 25))",
  },
  ".cm-diagnostic-warning": {
    borderLeftColor: "light-dark(oklch(0.52 0.11 68), oklch(0.82 0.12 80))",
  },
  ".cm-diagnostic-info": {
    borderLeftColor: "light-dark(oklch(0.5 0.12 245), oklch(0.78 0.1 245))",
  },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration:
      "underline wavy light-dark(oklch(0.52 0.19 27), oklch(0.74 0.16 25))",
    textUnderlineOffset: "3px",
  },
  ".cm-lintRange-warning": {
    backgroundImage: "none",
    textDecoration:
      "underline wavy light-dark(oklch(0.52 0.11 68), oklch(0.82 0.12 80))",
    textUnderlineOffset: "3px",
  },
  ".cm-lintRange-info": {
    backgroundImage: "none",
    textDecoration:
      "underline dotted light-dark(oklch(0.5 0.12 245), oklch(0.78 0.1 245))",
    textUnderlineOffset: "3px",
  },
  ".cm-panels": { backgroundColor: "transparent", color: "inherit" },
})

/** GitHub's light and dark syntax colours, paired. */
const github = HighlightStyle.define([
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: "light-dark(#6e7781, #8b949e)",
  },
  {
    tag: [
      tags.keyword,
      tags.operatorKeyword,
      tags.modifier,
      tags.controlKeyword,
    ],
    color: "light-dark(#cf222e, #ff7b72)",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.regexp],
    color: "light-dark(#0a3069, #a5d6ff)",
  },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom],
    color: "light-dark(#0550ae, #79c0ff)",
  },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: "light-dark(#8250df, #d2a8ff)",
  },
  {
    tag: [tags.typeName, tags.className, tags.namespace],
    color: "light-dark(#953800, #ffa657)",
  },
  {
    tag: [tags.tagName, tags.angleBracket],
    color: "light-dark(#116329, #7ee787)",
  },
  {
    tag: [tags.attributeName, tags.propertyName],
    color: "light-dark(#0550ae, #79c0ff)",
  },
  {
    tag: [tags.definition(tags.variableName)],
    color: "light-dark(#953800, #ffa657)",
  },
  { tag: [tags.operator], color: "light-dark(#cf222e, #ff7b72)" },
  {
    tag: [tags.meta, tags.processingInstruction],
    color: "light-dark(#6e7781, #8b949e)",
  },
  { tag: tags.invalid, color: "light-dark(#82071e, #ffa198)" },
])

export const highlighting = syntaxHighlighting(github)
