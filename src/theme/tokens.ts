import { defineTokens } from "@kirana-style/core"

/**
 * The brand's ground and ink, warm paper by day and warm night after, and
 * the playground's one hue, crater: clear water to play in. Every colour is a
 * `light-dark()` pair, following the scheme on `<html>`.
 */
export const color = defineTokens(
  "play",
  {
    background: "light-dark(oklch(0.988 0.004 85), oklch(0.165 0.008 70))",
    foreground: "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))",
    card: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    muted: "light-dark(oklch(0.962 0.007 85), oklch(0.25 0.01 70))",
    mutedForeground: "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))",
    border: "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))",
    accent: "light-dark(oklch(0.5 0.09 185), oklch(0.82 0.1 185))",
    accentSoft:
      "light-dark(oklch(0.5 0.09 185 / 10%), oklch(0.82 0.1 185 / 14%))",
    danger: "light-dark(oklch(0.52 0.19 27), oklch(0.74 0.16 25))",
    warning: "light-dark(oklch(0.52 0.11 68), oklch(0.82 0.12 80))",
    info: "light-dark(oklch(0.5 0.12 245), oklch(0.78 0.1 245))",
  },
  { variable: true }
)

export const font = defineTokens("play-font", {
  sans: '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
  wordmark: '"Crimson Pro", ui-serif, Georgia, serif',
})

export const radius = defineTokens("play-radius", {
  sm: "0.375rem",
  md: "0.5rem",
  xl: "0.875rem",
})
