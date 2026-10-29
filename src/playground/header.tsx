import { css } from "@kirana-style/core"

import type { Scheme } from "@/preview/protocol.ts"
import { color, font } from "@/theme/tokens.ts"

import {
  CodeIcon,
  EyeIcon,
  LinkIcon,
  MonitorIcon,
  MoonIcon,
  SplitIcon,
  StackIcon,
  SunIcon,
} from "./icons.tsx"
import { ui } from "./ui.ts"

export type Layout = "split" | "stacked" | "editor" | "preview"

const LAYOUTS: { id: Layout; label: string; Icon: typeof SplitIcon }[] = [
  { id: "split", label: "Side by side", Icon: SplitIcon },
  { id: "stacked", label: "Stacked", Icon: StackIcon },
  { id: "editor", label: "Code only", Icon: CodeIcon },
  { id: "preview", label: "Output only", Icon: EyeIcon },
]

const SCHEMES: { id: Scheme; label: string; Icon: typeof SunIcon }[] = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "system", label: "System", Icon: MonitorIcon },
]

type Props = {
  scheme: Scheme
  onScheme: (scheme: Scheme) => void
  onShare: () => void
  shared: boolean
  layout: Layout
  onLayout: (layout: Layout) => void
}

const styles = {
  header: css({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minHeight: "3.5rem",
    paddingInline: { base: "0.75rem", "@media (min-width: 48rem)": "1rem" },
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  }),
  brand: css({
    display: "flex",
    alignItems: "baseline",
    gap: "0.5rem",
    color: color.foreground,
    textDecorationLine: "none",
  }),
  wordmark: css({
    fontFamily: font.wordmark,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: "1.625rem",
    lineHeight: 1,
  }),
  slash: css({ color: color.mutedForeground, fontSize: "0.875rem" }),
  product: css({ fontSize: "0.875rem", fontWeight: 600 }),
  /** What a narrow screen leaves out of the header: the icons say enough. */
  wide: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline" },
  }),
  spacer: css({ flexGrow: 1 }),
  group: css({ display: "flex", alignItems: "center", gap: "0.25rem" }),
  layouts: css({
    display: { base: "none", "@media (min-width: 64rem)": "flex" },
    alignItems: "center",
    gap: "0.125rem",
    padding: "0.125rem",
    borderRadius: "0.625rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
  }),
  /** The scheme toggle is shown at every width; the layouts only where both panes fit. */
  schemes: css({ display: "flex" }),
  layoutButton: css({ minHeight: "1.75rem", paddingInline: "0.375rem" }),
  docs: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline-flex" },
    textDecorationLine: "none",
  }),
}

export function Header({
  scheme,
  onScheme,
  onShare,
  shared,
  layout,
  onLayout,
}: Props) {
  return (
    <header sx={styles.header}>
      <a href="https://kirana.style" sx={styles.brand}>
        <span sx={styles.wordmark}>Kirana</span>
        <span aria-hidden="true" sx={[styles.slash, styles.wide]}>
          /
        </span>
        <span sx={[styles.product, styles.wide]}>Playground</span>
      </a>
      <div sx={styles.spacer} />
      <div role="group" aria-label="Layout" sx={styles.layouts}>
        {LAYOUTS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={layout === id}
            onClick={() => onLayout(id)}
            sx={[ui.button, styles.layoutButton, layout === id && ui.pressed]}
          >
            <Icon sx={ui.icon} />
          </button>
        ))}
      </div>
      <div
        role="group"
        aria-label="Colour scheme"
        sx={[styles.layouts, styles.schemes]}
      >
        {SCHEMES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={scheme === id}
            onClick={() => onScheme(id)}
            sx={[ui.button, styles.layoutButton, scheme === id && ui.pressed]}
          >
            <Icon sx={ui.icon} />
          </button>
        ))}
      </div>
      <div sx={styles.group}>
        <a
          href="https://kirana.style/docs"
          target="_blank"
          rel="noreferrer"
          sx={[ui.button, styles.docs]}
        >
          Docs
        </a>
        <button
          type="button"
          aria-label={shared ? "Link copied" : "Share"}
          onClick={onShare}
          sx={[ui.button, ui.primary]}
        >
          <LinkIcon sx={ui.icon} />
          <span sx={styles.wide}>{shared ? "Link copied" : "Share"}</span>
        </button>
      </div>
    </header>
  )
}
