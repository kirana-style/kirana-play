/**
 * The name in the header, as the Kirana site and kirana-ui set their own: the
 * petal K beside the wordmark, "kirana" in Crimson Pro's semibold italic and
 * the product's word after it, light and muted, here "playground" where the
 * Kirana site writes "style". The K is drawn in one colour, `currentColor`:
 * the favicon's three parts, filled alike.
 */
import { css } from "@kirana-style/core"
import type { Sx } from "@kirana-style/core"

import { color, font } from "@/theme/tokens.ts"

const styles = {
  mark: css({ display: "block", flexShrink: 0, height: "21px", width: "auto" }),
  wordmark: css({
    display: "inline-flex",
    alignItems: "baseline",
    gap: "0.3em",
    fontSize: "1.375rem",
    lineHeight: 1,
    color: color.foreground,
    whiteSpace: "nowrap",
  }),
  name: css({
    fontFamily: font.wordmark,
    fontStyle: "italic",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  }),
  product: css({
    fontFamily: font.wordmark,
    fontSize: "0.85em",
    fontStyle: "italic",
    fontWeight: 300,
    color: color.mutedForeground,
  }),
}

/** The petal K, 16 × 21.5, in `currentColor`. */
export function KiranaMark({ sx }: { sx?: Sx }) {
  return (
    <svg
      viewBox="0 0 16 21.5"
      sx={[styles.mark, sx]}
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        d="M0 16.5829L0 0A5 5 0 0 1 5 5L5 8.8131A55 55 0 0 0 1.1191 13.9874A8 8 0 0 0 0 16.5829Z"
        stroke="currentColor"
        strokeWidth="0.2"
        strokeLinejoin="round"
      />
      <path d="M8.4322 9.8213L13.9389 13.8222A5 5 0 0 1 16 17.8673L16 21.5L7.3023 15.1808A3 3 0 0 1 8.4322 9.8213Z" />
      <path d="M0 16.5829A8 8 0 0 1 1.1191 13.9874A55 55 0 0 1 9.2279 4.3493A8 8 0 0 1 12.6708 2.4335A13 13 0 0 1 16 2A8 8 0 0 1 15.2857 5.3043A5 5 0 0 1 12.8439 7.7713L4.2366 11.7819A8 8 0 0 0 0 16.5829Z" />
    </svg>
  )
}

export function Wordmark({ sx }: { sx?: Sx }) {
  return (
    <span sx={[styles.wordmark, sx]}>
      {/* The space reads the two words apart; flex layout does not draw it, the gap does. */}
      <span sx={styles.name}>kirana</span> <span sx={styles.product}>play</span>
    </span>
  )
}
