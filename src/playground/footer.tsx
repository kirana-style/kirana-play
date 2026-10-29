import { css } from "@kirana-style/core"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

import { color, font } from "@/theme/tokens.ts"
import { Button } from "@/ui/components/button.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select.tsx"
import { Icon } from "@/ui/primitives/icon.tsx"

import { EXAMPLES } from "./examples.ts"
import type { Example } from "./examples.ts"
import type { Status } from "./use-compiler.ts"

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
  menu: css({ width: "min(21rem, calc(100vw - 1rem))" }),
  option: css({ alignItems: "start" }),
  optionCopy: css({ display: "grid", gap: "0.125rem" }),
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
  version: css({ fontFamily: font.mono }),
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
  const current = EXAMPLES.find((item) => item.id === example)

  return (
    <footer sx={styles.footer}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
          <span sx={styles.exampleLabel}>Example</span>
          <span sx={styles.exampleName}>
            {current?.title ?? "Your project"}
          </span>
          <Icon icon={ArrowDown01Icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" submenu sx={styles.menu}>
          <DropdownMenuRadioGroup
            value={example ?? ""}
            onValueChange={(id: string) => {
              const chosen = EXAMPLES.find((item) => item.id === id)
              if (chosen) onExample(chosen)
            }}
          >
            {EXAMPLES.map((item) => (
              <DropdownMenuRadioItem
                key={item.id}
                value={item.id}
                // Choosing an example is the whole errand: the menu closes.
                closeOnClick
                sx={styles.option}
              >
                <span sx={styles.optionCopy}>
                  <span sx={styles.optionTitle}>{item.title}</span>
                  <span sx={styles.optionText}>{item.description}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span
        role="status"
        data-state={status.kind}
        title={statusText(status)}
        sx={[styles.status, status.kind === "failed" && styles.failed]}
      >
        {statusText(status)}
      </span>
      <div sx={styles.versionLabel}>
        <span sx={styles.wide} aria-hidden="true">
          Kirana
        </span>
        <Select
          value={version}
          onValueChange={(next) => {
            if (typeof next === "string") onVersion(next)
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label="Kirana version"
            sx={styles.version}
          >
            <SelectValue>{(value: string) => `v${value}`}</SelectValue>
          </SelectTrigger>
          <SelectContent side="top" alignItemWithTrigger={false}>
            {choices.map((choice) => (
              <SelectItem key={choice} value={choice} sx={styles.version}>
                v{choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </footer>
  )
}
