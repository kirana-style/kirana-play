import { useState } from "react"
import { css } from "@kirana-style/core"
import {
  Add01Icon,
  Cancel01Icon,
  FileCodeIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"

import { CONFIG_FILE } from "@/engine/protocol.ts"
import { color, font } from "@/theme/tokens.ts"

import { Button } from "@/ui/components/button.tsx"
import { Icon } from "@/ui/primitives/icon.tsx"

import { invalidName } from "./project.ts"
import type { ProjectFile } from "./project.ts"
import { ui } from "./ui.ts"

type Props = {
  files: ProjectFile[]
  active: string
  problems: ReadonlyMap<string, "error" | "warning">
  onSelect: (name: string) => void
  onAdd: () => void
  onRename: (from: string, to: string) => void
  onRemove: (name: string) => void
}

const styles = {
  tab: css({ paddingInline: "0.75rem 0.375rem" }),
  dot: css({
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "999px",
    flexShrink: 0,
  }),
  error: css({ backgroundColor: color.danger }),
  warning: css({ backgroundColor: color.warning }),
  close: css({
    display: "grid",
    placeItems: "center",
    width: "1.25rem",
    height: "1.25rem",
    borderRadius: "0.25rem",
    color: color.mutedForeground,
    backgroundColor: { base: "transparent", ":hover": color.muted },
    opacity: { base: 0.6, ":hover": 1 },
  }),
  input: css({
    width: "9rem",
    minHeight: "1.75rem",
    marginBlock: "auto",
    marginInline: "0.25rem",
    paddingInline: "0.5rem",
    borderRadius: "0.375rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: color.accent, '[aria-invalid="true"]': color.danger },
    backgroundColor: color.card,
    color: color.foreground,
    fontFamily: font.mono,
    fontSize: "0.75rem",
    outlineStyle: "none",
  }),
  add: css({ flexShrink: 0, marginBlock: "auto", marginInline: "0.25rem" }),
}

export function FileTabs({
  files,
  active,
  problems,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: Props) {
  const [editing, setEditing] = useState<{ from: string; to: string }>()
  const error = editing
    ? invalidName(editing.to, files, editing.from)
    : undefined

  const finish = () => {
    if (editing && !error && editing.to !== editing.from)
      onRename(editing.from, editing.to)
    setEditing(undefined)
  }

  return (
    <div role="tablist" aria-label="Files" sx={ui.bar}>
      {files.map((file) => {
        const selected = file.name === active
        const config = file.name === CONFIG_FILE
        const problem = problems.get(file.name)
        if (editing?.from === file.name)
          return (
            <input
              key={file.name}
              autoFocus
              aria-label={`Rename ${file.name}`}
              aria-invalid={error !== undefined}
              title={error}
              value={editing.to}
              onChange={(event) =>
                setEditing({ ...editing, to: event.target.value.trim() })
              }
              onBlur={finish}
              onKeyDown={(event) => {
                if (event.key === "Enter") finish()
                if (event.key === "Escape") setEditing(undefined)
              }}
              sx={styles.input}
            />
          )
        return (
          <div
            key={file.name}
            role="tab"
            tabIndex={selected ? 0 : -1}
            aria-selected={selected}
            title={config ? file.name : `${file.name}: double-click to rename`}
            onClick={() => onSelect(file.name)}
            onDoubleClick={() =>
              !config && setEditing({ from: file.name, to: file.name })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ")
                onSelect(file.name)
              if (event.key === "F2" && !config)
                setEditing({ from: file.name, to: file.name })
            }}
            sx={[ui.tab, styles.tab, selected && ui.selectedTab]}
          >
            <Icon icon={config ? Settings02Icon : FileCodeIcon} />
            <span sx={ui.mono}>{file.name}</span>
            {problem && (
              <span
                aria-label={problem === "error" ? "has errors" : "has warnings"}
                sx={[
                  styles.dot,
                  problem === "error" ? styles.error : styles.warning,
                ]}
              />
            )}
            {!config && files.length > 1 && (
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Remove ${file.name}`}
                title={`Remove ${file.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(file.name)
                }}
                sx={styles.close}
              >
                <Icon icon={Cancel01Icon} size="0.75rem" />
              </span>
            )}
          </div>
        )
      })}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Add a file"
        title="Add a file"
        onClick={onAdd}
        sx={styles.add}
      >
        <Icon icon={Add01Icon} />
      </Button>
    </div>
  )
}
