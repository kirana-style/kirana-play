/** The pieces of the interface several components share. */
import { css } from "@kirana-style/core"

import { color, font, radius } from "@/theme/tokens.ts"

export const ui = {
  /** A quiet button: text and an icon on the ground, tinted on hover. */
  button: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    minHeight: "2rem",
    paddingInline: "0.625rem",
    borderWidth: 0,
    borderRadius: radius.md,
    backgroundColor: { base: "transparent", ":hover": color.muted },
    color: { base: color.mutedForeground, ":hover": color.foreground },
    fontFamily: font.sans,
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    outlineColor: color.accent,
    outlineOffset: "2px",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    whiteSpace: "nowrap",
  }),
  /** A tab in a strip: underlined in ink when selected, as the kit's line tabs are. */
  tab: css({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    height: "100%",
    minHeight: "2.75rem",
    paddingInline: "0.75rem",
    borderWidth: 0,
    backgroundColor: "transparent",
    color: { base: color.mutedForeground, ":hover": color.foreground },
    fontFamily: font.sans,
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    outlineColor: color.accent,
    outlineOffset: "-2px",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    boxShadow: {
      base: "none",
      '[aria-selected="true"]': `inset 0 -2px 0 ${color.foreground}`,
    },
  }),
  selectedTab: css({
    color: { base: color.foreground, ":hover": color.foreground },
  }),
  /** A strip of tabs or tools along a pane's top. */
  bar: css({
    display: "flex",
    alignItems: "stretch",
    minHeight: "2.75rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
    overflowX: "auto",
    scrollbarWidth: "none",
  }),
  mono: css({ fontFamily: font.mono }),
  label: css({
    fontFamily: font.mono,
    fontSize: "0.6875rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: color.mutedForeground,
  }),
}
