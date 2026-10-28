import { useMemo, useState } from "react"
import type { Ref } from "react"
import { css } from "@kirana-style/core"
import { gzipSync, strToU8 } from "fflate"

import { Editor } from "@/editor/Editor.tsx"
import { color, font } from "@/theme/tokens.ts"

import { CopyIcon } from "./icons.tsx"
import { formatBytes, layersOf } from "./stylesheet.ts"
import { ui } from "./ui.ts"
import type { Compiled } from "./useCompiler.ts"

export type OutputTab = "preview" | "css" | "compiled"

type Props = {
  tab: OutputTab
  onTab: (tab: OutputTab) => void
  output?: Compiled
  frameRef: Ref<HTMLIFrameElement>
  frameDocument: string
  runtimeError?: string
}

const TABS: { id: OutputTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "css", label: "CSS" },
  { id: "compiled", label: "Compiled" },
]

const styles = {
  root: css({
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    height: "100%",
  }),
  body: css({ position: "relative", flexGrow: 1, minHeight: 0 }),
  fill: css({ position: "absolute", inset: 0 }),
  hidden: css({ display: "none" }),
  frame: css({
    display: "block",
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: color.background,
  }),
  overlay: css({
    position: "absolute",
    insetInline: "1rem",
    insetBlockEnd: "1rem",
    padding: "0.75rem 1rem",
    borderRadius: "0.625rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.danger,
    backgroundColor: color.card,
    color: color.foreground,
    fontFamily: font.mono,
    fontSize: "0.75rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    boxShadow: "0 8px 24px light-dark(oklch(0 0 0 / 8%), oklch(0 0 0 / 45%))",
  }),
  overlayLabel: css({
    display: "block",
    marginBlockEnd: "0.25rem",
    color: color.danger,
  }),
  code: css({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  }),
  tools: css({
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    paddingInline: "0.5rem",
    minHeight: "2.75rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
    overflowX: "auto",
    scrollbarWidth: "none",
  }),
  chip: css({
    minHeight: "1.75rem",
    paddingInline: "0.5rem",
    fontFamily: font.mono,
    fontWeight: 500,
    fontSize: "0.75rem",
  }),
  size: css({
    marginInlineStart: "auto",
    paddingInline: "0.5rem",
    fontFamily: font.mono,
    fontSize: "0.75rem",
    color: color.mutedForeground,
    whiteSpace: "nowrap",
  }),
  editor: css({ flexGrow: 1, minHeight: 0 }),
  select: css({
    minHeight: "1.75rem",
    paddingInline: "0.5rem",
    borderRadius: "0.375rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
    backgroundColor: color.background,
    color: color.foreground,
    fontFamily: font.mono,
    fontSize: "0.75rem",
  }),
}

function CssView({ css: stylesheet }: { css: string }) {
  const [layer, setLayer] = useState("all")
  const [copied, setCopied] = useState(false)
  const layers = useMemo(() => layersOf(stylesheet), [stylesheet])
  const shown =
    layer === "all"
      ? stylesheet
      : (layers.find((l) => l.name === layer)?.css ?? "")
  const sizes = useMemo(() => {
    const bytes = strToU8(stylesheet)
    return { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length }
  }, [stylesheet])
  return (
    <div sx={styles.code}>
      <div role="toolbar" aria-label="Layers" sx={styles.tools}>
        {[{ name: "all" }, ...layers].map(({ name }) => (
          <button
            key={name}
            type="button"
            aria-pressed={layer === name}
            onClick={() => setLayer(name)}
            sx={[ui.button, styles.chip, layer === name && ui.pressed]}
          >
            {name === "all" ? "All" : name.replace(/^kirana\./, "")}
          </button>
        ))}
        <span sx={styles.size}>
          {formatBytes(sizes.raw)} · {formatBytes(sizes.gzip)} gzip
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(shown).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          sx={[ui.button, styles.chip]}
        >
          <CopyIcon sx={ui.icon} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div sx={styles.editor}>
        <Editor
          file="stylesheet.css"
          value={shown}
          language="css"
          readOnly
          label="Compiled CSS"
        />
      </div>
    </div>
  )
}

function CompiledView({ compiled }: { compiled: Record<string, string> }) {
  const files = Object.keys(compiled)
  const [chosen, setChosen] = useState<string>()
  const file = chosen && files.includes(chosen) ? chosen : files[0]
  return (
    <div sx={styles.code}>
      <div sx={styles.tools}>
        <label>
          <span sx={ui.visuallyHidden}>Module</span>
          <select
            value={file}
            onChange={(event) => setChosen(event.target.value)}
            sx={styles.select}
          >
            {files.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span sx={styles.size}>as Kirana rewrites it</span>
      </div>
      <div sx={styles.editor}>
        {file && (
          <Editor
            file={`compiled:${file}`}
            value={compiled[file] ?? ""}
            language="tsx"
            readOnly
            label={`${file} compiled`}
          />
        )}
      </div>
    </div>
  )
}

export function OutputPane({
  tab,
  onTab,
  output,
  frameRef,
  frameDocument,
  runtimeError,
}: Props) {
  return (
    <section aria-label="Output" sx={styles.root}>
      <div role="tablist" aria-label="Output" sx={ui.bar}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTab(id)}
            sx={[ui.tab, tab === id && ui.selectedTab]}
          >
            {label}
          </button>
        ))}
      </div>
      <div sx={styles.body}>
        {/* The frame stays mounted on every tab: it also evaluates the configuration. */}
        <div sx={[styles.fill, tab !== "preview" && styles.hidden]}>
          <iframe
            ref={frameRef}
            title="Preview"
            sandbox="allow-scripts"
            srcDoc={frameDocument}
            sx={styles.frame}
          />
          {runtimeError && (
            <div role="alert" sx={styles.overlay}>
              <span sx={ui.label}>
                <span sx={styles.overlayLabel}>The preview failed</span>
              </span>
              {runtimeError}
            </div>
          )}
        </div>
        {tab === "css" && <CssView css={output?.css ?? ""} />}
        {tab === "compiled" && (
          <CompiledView compiled={output?.compiled ?? {}} />
        )}
      </div>
    </section>
  )
}
