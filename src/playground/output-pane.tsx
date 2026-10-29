import { useMemo, useState } from "react"
import type { Ref } from "react"
import { css } from "@kirana-style/core"
import { gzipSync, strToU8 } from "fflate"

import { Copy01Icon } from "@hugeicons/core-free-icons"

import { Editor } from "@/editor/editor.tsx"
import { color, font } from "@/theme/tokens.ts"
import { Button } from "@/ui/components/button.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select.tsx"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/ui/components/tabs.tsx"
import { ToggleGroup, ToggleGroupItem } from "@/ui/components/toggle-group.tsx"
import { Icon } from "@/ui/primitives/icon.tsx"

import { formatBytes, layersOf } from "./stylesheet.ts"
import { ui } from "./ui.ts"
import type { Compiled } from "./use-compiler.ts"

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
    gap: 0,
    minHeight: 0,
    minWidth: 0,
    height: "100%",
  }),
  list: css({ alignSelf: "center", marginInline: "0.5rem" }),
  body: css({ position: "relative", flexGrow: 1, minHeight: 0 }),
  fill: css({ position: "absolute", inset: 0 }),
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
  chip: css({ fontFamily: font.mono }),
  size: css({
    marginInlineStart: "auto",
    paddingInline: "0.5rem",
    fontFamily: font.mono,
    fontSize: "0.75rem",
    color: color.mutedForeground,
    whiteSpace: "nowrap",
  }),
  editor: css({ flexGrow: 1, minHeight: 0 }),
  module: css({ fontFamily: font.mono }),
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
      <div sx={styles.tools}>
        <ToggleGroup
          aria-label="Layer"
          size="sm"
          spacing={1}
          value={[layer]}
          onValueChange={(next: string[]) => {
            if (next[0]) setLayer(next[0])
          }}
        >
          {[{ name: "all" }, ...layers].map(({ name }) => (
            <ToggleGroupItem key={name} value={name} sx={styles.chip}>
              {name === "all" ? "All" : name.replace(/^kirana\./, "")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span sx={styles.size}>
          {formatBytes(sizes.raw)} · {formatBytes(sizes.gzip)} gzip
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(shown).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          <Icon icon={Copy01Icon} />
          {copied ? "Copied" : "Copy"}
        </Button>
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
        <Select
          value={file ?? null}
          onValueChange={(next) => {
            if (typeof next === "string") setChosen(next)
          }}
        >
          <SelectTrigger size="sm" aria-label="Module" sx={styles.module}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {files.map((name) => (
              <SelectItem key={name} value={name} sx={styles.module}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    <Tabs
      value={tab}
      onValueChange={(next) => onTab(next as OutputTab)}
      aria-label="Output"
      render={<section />}
      sx={styles.root}
    >
      <div sx={ui.bar}>
        <TabsList variant="line" sx={styles.list}>
          {TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div sx={styles.body}>
        {/* The frame stays mounted on every tab: it also evaluates the configuration.
            Without allow-same-origin it is an opaque origin; allow-forms lets a
            project's form fire its submit event, which a sandbox otherwise drops. */}
        <TabsContent value="preview" keepMounted sx={styles.fill}>
          <iframe
            ref={frameRef}
            title="Preview"
            sandbox="allow-scripts allow-forms"
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
        </TabsContent>
        <TabsContent value="css" sx={styles.fill}>
          <CssView css={output?.css ?? ""} />
        </TabsContent>
        <TabsContent value="compiled" sx={styles.fill}>
          <CompiledView compiled={output?.compiled ?? {}} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
