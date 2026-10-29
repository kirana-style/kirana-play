import { css } from "@kirana-style/core"
import type { Sx } from "@kirana-style/core"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ComputerIcon,
  LayoutTwoColumnIcon,
  LayoutTwoRowIcon,
  Link01Icon,
  Moon02Icon,
  SourceCodeIcon,
  Sun03Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import type { Scheme } from "@/preview/protocol.ts"
import { color } from "@/theme/tokens.ts"
import { Button } from "@/ui/components/button.tsx"
import { ToggleGroup, ToggleGroupItem } from "@/ui/components/toggle-group.tsx"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip.tsx"
import { Icon } from "@/ui/primitives/icon.tsx"

import { KiranaMark, Wordmark } from "./brand.tsx"

export type Layout = "split" | "stacked" | "editor" | "preview"

type Choice<T> = { id: T; label: string; icon: IconSvgElement }

const LAYOUTS: Choice<Layout>[] = [
  { id: "split", label: "Side by side", icon: LayoutTwoColumnIcon },
  { id: "stacked", label: "Stacked", icon: LayoutTwoRowIcon },
  { id: "editor", label: "Code only", icon: SourceCodeIcon },
  { id: "preview", label: "Output only", icon: ViewIcon },
]

const SCHEMES: Choice<Scheme>[] = [
  { id: "light", label: "Light", icon: Sun03Icon },
  { id: "dark", label: "Dark", icon: Moon02Icon },
  { id: "system", label: "System", icon: ComputerIcon },
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
    alignItems: "center",
    gap: "0.5rem",
    color: color.foreground,
    textDecorationLine: "none",
  }),
  /** What a narrow screen leaves out of the header: the icons say enough. */
  wide: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline" },
  }),
  spacer: css({ flexGrow: 1 }),
  /** The layouts only where both panes fit; the scheme at every width. */
  layouts: css({
    display: { base: "none", "@media (min-width: 64rem)": "flex" },
  }),
  docs: css({
    display: { base: "none", "@media (min-width: 40rem)": "inline-flex" },
  }),
}

/** A segmented choice of icons, each named by its tooltip and its label. */
function Choices<T extends string>({
  label,
  choices,
  value,
  onChange,
  sx,
}: {
  label: string
  choices: Choice<T>[]
  value: T
  onChange: (value: T) => void
  sx?: Sx
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(next: string[]) => {
        // A pressed item pressed again would leave nothing chosen: keep it.
        if (next[0]) onChange(next[0] as T)
      }}
      sx={sx}
    >
      {choices.map((choice) => (
        <Tooltip key={choice.id}>
          <TooltipTrigger
            render={
              <ToggleGroupItem value={choice.id} aria-label={choice.label} />
            }
          >
            <Icon icon={choice.icon} />
          </TooltipTrigger>
          <TooltipContent>{choice.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  )
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
    <TooltipProvider>
      <header sx={styles.header}>
        <a href="/" aria-label="kirana play, home" sx={styles.brand}>
          <KiranaMark />
          <Wordmark />
        </a>
        <div sx={styles.spacer} />
        <Choices
          label="Layout"
          choices={LAYOUTS}
          value={layout}
          onChange={onLayout}
          sx={styles.layouts}
        />
        <Choices
          label="Colour scheme"
          choices={SCHEMES}
          value={scheme}
          onChange={onScheme}
        />
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <a
              href="https://kirana.style/docs"
              target="_blank"
              rel="noreferrer"
            />
          }
          sx={styles.docs}
        >
          Docs
        </Button>
        <Button
          size="sm"
          aria-label={shared ? "Link copied" : "Share"}
          onClick={onShare}
        >
          <Icon icon={Link01Icon} />
          <span sx={styles.wide}>{shared ? "Link copied" : "Share"}</span>
        </Button>
      </header>
    </TooltipProvider>
  )
}
