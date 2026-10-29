import { useState } from "react"
import { css } from "@kirana-style/core"

import type { Diagnostic } from "@/engine/protocol.ts"
import { color, font } from "@/theme/tokens.ts"

import { ChevronIcon } from "./icons.tsx"
import { ui } from "./ui.ts"

type Props = {
  diagnostics: readonly Diagnostic[]
  onOpen: (diagnostic: Diagnostic) => void
}

const styles = {
  root: css({
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: color.border,
    maxHeight: "40%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  }),
  summary: css({
    width: "100%",
    justifyContent: "flex-start",
    minHeight: "2.25rem",
    borderRadius: 0,
    paddingInline: "1rem",
  }),
  count: css({
    fontFamily: font.mono,
    fontWeight: 500,
    color: color.mutedForeground,
  }),
  chevron: css({
    marginInlineStart: "auto",
    transitionProperty: "transform",
    transitionDuration: "150ms",
  }),
  open: css({ transform: "rotate(180deg)" }),
  list: css({
    margin: 0,
    padding: 0,
    listStyle: "none",
    overflowY: "auto",
    paddingBlockEnd: "0.5rem",
  }),
  item: css({
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: "0.625rem",
    width: "100%",
    paddingBlock: "0.375rem",
    paddingInline: "1rem",
    borderWidth: 0,
    backgroundColor: { base: "transparent", ":hover": color.muted },
    color: color.foreground,
    textAlign: "start",
    fontFamily: font.sans,
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    cursor: "pointer",
    outlineColor: color.accent,
    outlineOffset: "-2px",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
  }),
  severity: css({
    fontFamily: font.mono,
    fontSize: "0.6875rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    paddingBlockStart: "0.125rem",
  }),
  error: css({ color: color.danger }),
  warning: css({ color: color.warning }),
  info: css({ color: color.info }),
  where: css({
    fontFamily: font.mono,
    fontSize: "0.75rem",
    color: color.mutedForeground,
  }),
  help: css({ display: "block", color: color.mutedForeground }),
  clean: css({
    paddingInline: "1rem",
    paddingBlockEnd: "0.75rem",
    fontSize: "0.8125rem",
    color: color.mutedForeground,
  }),
}

const SEVERITY = {
  error: styles.error,
  warning: styles.warning,
  info: styles.info,
}

export function Problems({ diagnostics, onOpen }: Props) {
  const [open, setOpen] = useState(true)
  const errors = diagnostics.filter((d) => d.severity === "error").length
  const warnings = diagnostics.filter((d) => d.severity === "warning").length
  return (
    <section aria-label="Problems" sx={styles.root}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        sx={[ui.button, styles.summary]}
      >
        Problems
        <span sx={styles.count}>
          {errors} {errors === 1 ? "error" : "errors"} · {warnings}{" "}
          {warnings === 1 ? "warning" : "warnings"} ·{" "}
          {diagnostics.length - errors - warnings} info
        </span>
        <ChevronIcon sx={[ui.icon, styles.chevron, open && styles.open]} />
      </button>
      {open &&
        (diagnostics.length === 0 ? (
          <p sx={styles.clean}>
            Nothing to report: every style compiled to static CSS.
          </p>
        ) : (
          <ul sx={styles.list}>
            {diagnostics.map((diagnostic, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onOpen(diagnostic)}
                  sx={styles.item}
                >
                  <span sx={[styles.severity, SEVERITY[diagnostic.severity]]}>
                    {diagnostic.severity}
                  </span>
                  <span>
                    {diagnostic.message}{" "}
                    <span sx={styles.where}>
                      {diagnostic.code} {diagnostic.name}
                      {diagnostic.file &&
                        ` · ${diagnostic.file}${diagnostic.start ? `:${diagnostic.start.line}:${diagnostic.start.column}` : ""}`}
                    </span>
                    {diagnostic.help.map((line) => (
                      <span key={line} sx={styles.help}>
                        help: {line}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
