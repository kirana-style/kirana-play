import { useEffect, useRef, useState } from "react"
import { css } from "@kirana-style/core"

import { color, font } from "@/theme/tokens.ts"

import { EXAMPLES } from "./examples.ts"
import type { Example } from "./examples.ts"
import { ChevronIcon } from "./icons.tsx"
import { ui } from "./ui.ts"
import type { Status } from "./useCompiler.ts"

type Props = {
  example?: string
  onExample: (example: Example) => void
  status: Status
  version: string
  versions: readonly string[]
  onVersion: (version: string) => void
}

const styles = {
  footer: css({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minHeight: "2.75rem",
    paddingInline: { base: "0.5rem", "@media (min-width: 48rem)": "0.75rem" },
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: color.border,
  }),
  exampleLabel: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline" },
    color: color.mutedForeground,
    fontWeight: 500,
  }),
  wide: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline" },
  }),
  exampleName: css({ color: color.foreground }),
  menu: css({
    position: "absolute",
    insetBlockEnd: "calc(100% + 0.375rem)",
    insetInlineStart: "0.5rem",
    zIndex: 10,
    display: "grid",
    width: "min(20rem, calc(100vw - 1rem))",
    margin: 0,
    padding: "0.25rem",
    listStyle: "none",
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
    backgroundColor: color.card,
    boxShadow: "0 12px 32px light-dark(oklch(0 0 0 / 12%), oklch(0 0 0 / 55%))",
  }),
  option: css({
    display: "grid",
    gap: "0.125rem",
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderWidth: 0,
    borderRadius: "0.625rem",
    backgroundColor: {
      base: "transparent",
      ":hover": color.muted,
      ":focus-visible": color.muted,
    },
    color: color.foreground,
    textAlign: "start",
    fontFamily: font.sans,
    cursor: "pointer",
    outlineStyle: "none",
  }),
  current: css({
    backgroundColor: { base: color.accentSoft, ":hover": color.accentSoft },
  }),
  optionTitle: css({ fontSize: "0.8125rem", fontWeight: 600 }),
  optionText: css({ fontSize: "0.75rem", color: color.mutedForeground }),
  status: css({
    flexGrow: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: font.mono,
    fontSize: "0.75rem",
    color: color.mutedForeground,
  }),
  failed: css({ color: color.danger }),
  versionLabel: css({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: color.mutedForeground,
  }),
  version: css({
    appearance: "none",
    minHeight: "1.75rem",
    paddingInline: "0.5rem 1.375rem",
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
    backgroundColor: { base: "transparent", ":hover": color.muted },
    backgroundImage: `linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)`,
    backgroundPosition: "calc(100% - 0.75rem) 55%, calc(100% - 0.5rem) 55%",
    backgroundSize: "0.25rem 0.25rem",
    backgroundRepeat: "no-repeat",
    color: color.foreground,
    fontFamily: font.mono,
    fontSize: "0.75rem",
    cursor: "pointer",
    outlineColor: color.accent,
    outlineOffset: "2px",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
  }),
}

function statusText(status: Status): string {
  switch (status.kind) {
    case "loading":
      return `Starting Kirana ${status.version}…`
    case "compiling":
      return "Compiling…"
    case "done":
      return `Compiled in ${status.ms < 10 ? status.ms.toFixed(1) : Math.round(status.ms)} ms`
    case "failed":
      return status.message
  }
}

export function Footer({
  example,
  onExample,
  status,
  version,
  versions,
  onVersion,
}: Props) {
  const choices = versions.includes(version) ? versions : [version, ...versions]
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const current = EXAMPLES.find((item) => item.id === example)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !root.current?.contains(event.target as Node)
      )
        setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  return (
    <footer sx={styles.footer}>
      <div ref={root}>
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          sx={ui.button}
        >
          <span sx={styles.exampleLabel}>Example</span>
          <span sx={styles.exampleName}>
            {current?.title ?? "Your project"}
          </span>
          <ChevronIcon sx={ui.icon} />
        </button>
        {open && (
          <ul role="menu" aria-label="Examples" sx={styles.menu}>
            {EXAMPLES.map((item) => (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  autoFocus={item.id === (example ?? EXAMPLES[0]!.id)}
                  onClick={() => {
                    setOpen(false)
                    onExample(item)
                  }}
                  sx={[styles.option, item.id === example && styles.current]}
                >
                  <span sx={styles.optionTitle}>{item.title}</span>
                  <span sx={styles.optionText}>{item.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span
        role="status"
        data-state={status.kind}
        title={statusText(status)}
        sx={[styles.status, status.kind === "failed" && styles.failed]}
      >
        {statusText(status)}
      </span>
      <label sx={styles.versionLabel}>
        <span sx={styles.wide}>Kirana</span>
        <span sx={ui.visuallyHidden}>version</span>
        <select
          value={version}
          onChange={(event) => onVersion(event.target.value)}
          sx={styles.version}
        >
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              v{choice}
            </option>
          ))}
        </select>
      </label>
    </footer>
  )
}
