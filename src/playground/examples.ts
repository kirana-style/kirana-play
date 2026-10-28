/**
 * The examples the footer offers. The four after the starter are the curated
 * examples kirana.style showed on `/play`, now editable.
 */
import type { Shared } from "./share.ts"

export type Example = {
  id: string
  title: string
  description: string
  files: Shared["files"]
}

const CONFIG = `import { defineConfig } from "@kirana-style/core/config"

// The project's configuration: prefix, layers, targets, conditions.
// The playground evaluates it and hands the engine the result.
export default defineConfig({
  layers: { before: ["reset"] },
})
`

const STARTER_APP = `import { css } from "@kirana-style/core"

import { Card } from "./Card"
import { color, space } from "./tokens"

const steps = [
  <>Edit the root component in <code>App.tsx</code>.</>,
  <>Add files with <code>+</code>; import them as <code>./Card</code>.</>,
  <>Define tokens in <code>tokens.ts</code> and read them anywhere.</>,
  <>Share copies a link that holds the whole project.</>,
]

export default function App() {
  return (
    <main sx={styles.page}>
      <Card title="Kirana playground">
        <ul sx={styles.steps}>
          {steps.map((step, index) => (
            <li key={index} sx={styles.step}>
              <span aria-hidden="true" sx={styles.check}>✓</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        <a sx={styles.link} href="https://kirana.style/docs" target="_blank" rel="noreferrer">
          Read the docs →
        </a>
      </Card>
    </main>
  )
}

const styles = {
  page: css({ display: "grid", placeItems: "center", padding: space.lg }),
  steps: css({ display: "grid", gap: space.sm, margin: 0, padding: 0, listStyle: "none" }),
  step: css({
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    padding: space.sm,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.border,
    fontSize: "0.875rem",
  }),
  check: css({
    display: "grid",
    placeItems: "center",
    width: "1.25rem",
    height: "1.25rem",
    flexShrink: 0,
    borderRadius: "999px",
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: "0.75rem",
  }),
  link: css({
    justifySelf: "start",
    color: { base: color.accent, ":hover": color.ink },
    fontWeight: 600,
    textUnderlineOffset: "0.2em",
  }),
}
`

const STARTER_CARD = `import type { ReactNode } from "react"
import { css } from "@kirana-style/core"

import { color, space } from "./tokens"

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article sx={card}>
      <h1 sx={heading}>{title}</h1>
      {children}
    </article>
  )
}

const card = css({
  display: "grid",
  gap: space.md,
  width: "min(100%, 26rem)",
  padding: { base: space.md, "@media (min-width: 40rem)": space.lg },
  borderRadius: "0.875rem",
  backgroundColor: color.paper,
  color: color.ink,
  boxShadow: "0 1px 2px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 40%))",
})

const heading = css({ margin: 0, fontSize: "1.5rem", fontWeight: 500 })
`

const STARTER_TOKENS = `import { defineTokens } from "@kirana-style/core"

// Variable tokens: typed constants in the source, custom properties in the CSS.
export const color = defineTokens(
  "color",
  {
    ink: "light-dark(#1a1510, #f5f2ec)",
    paper: "light-dark(#ffffff, #1c1915)",
    border: "light-dark(#e9e4dc, #34302a)",
    accent: "light-dark(#00736a, #6fd6c8)",
    onAccent: "light-dark(#ffffff, #110e0b)",
  },
  { variable: true }
)

// Inline tokens: their values are written into each rule.
export const space = defineTokens("space", { sm: "0.5rem", md: "1rem", lg: "2rem" })
`

const curated = (
  id: string,
  title: string,
  description: string,
  code: string
): Example => ({
  id,
  title,
  description,
  files: [{ name: "App.tsx", code }],
})

export const EXAMPLES: Example[] = [
  {
    id: "starter",
    title: "Starter",
    description: "Components, tokens and a configuration in their own files",
    files: [
      { name: "App.tsx", code: STARTER_APP },
      { name: "Card.tsx", code: STARTER_CARD },
      { name: "tokens.ts", code: STARTER_TOKENS },
      { name: "kirana.config.ts", code: CONFIG },
    ],
  },
  curated(
    "button-variants",
    "Button variants",
    "Conditions inside values; the later handle wins per entry",
    `import { css } from "@kirana-style/core"

const styles = {
  base: css({
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "0.5rem",
    paddingInline: "0.875rem",
    paddingBlock: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    // A condition nests inside the value it changes, so the whole story of
    // \`background-color\` is in one place.
    backgroundColor: {
      base: "light-dark(oklch(0.21 0 0), oklch(0.92 0 0))",
      ":hover": "light-dark(oklch(0.31 0 0), oklch(0.85 0 0))",
    },
    color: "light-dark(oklch(0.98 0 0), oklch(0.21 0 0))",
  }),
  quiet: css({
    backgroundColor: {
      base: "transparent",
      ":hover": "light-dark(oklch(0.95 0 0), oklch(0.27 0 0))",
    },
    color: "light-dark(oklch(0.21 0 0), oklch(0.92 0 0))",
  }),
}

export default function ButtonVariants() {
  return (
    <div sx={css({ display: "flex", gap: "0.75rem" })}>
      <button sx={styles.base}>Save changes</button>
      {/* The later handle wins per entry: \`:hover\` here replaces the \`:hover\`
          above, and the base colour replaces the base colour. */}
      <button sx={[styles.base, styles.quiet]}>Cancel</button>
    </div>
  )
}
`
  ),
  curated(
    "compile-card",
    "Card",
    "A media condition and a hover, one class per declaration",
    `import { css } from "@kirana-style/core"

const styles = {
  card: css({
    display: "grid",
    gap: "0.25rem",
    maxWidth: "18rem",
    borderRadius: "0.75rem",
    padding: { base: "1rem", "@media (min-width: 40rem)": "1.25rem" },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      base: "light-dark(oklch(0.92 0 0), oklch(0.3 0 0))",
      ":hover": "light-dark(oklch(0.7 0 0), oklch(0.5 0 0))",
    },
    transitionProperty: "border-color",
    transitionDuration: "150ms",
  }),
  title: css({ fontWeight: 600 }),
  text: css({
    fontSize: "0.875rem",
    color: "light-dark(oklch(0.45 0 0), oklch(0.7 0 0))",
  }),
}

export default function CompileCard() {
  return (
    <article sx={styles.card}>
      <h3 sx={styles.title}>One class per declaration</h3>
      <p sx={styles.text}>Hover the card: the condition lives in its value.</p>
    </article>
  )
}
`
  ),
  curated(
    "relation-field",
    "Relation",
    "A field's state read by its parts, through a named relation",
    `import { useState } from "react"
import { css, relation } from "@kirana-style/core"

// Named once; the anchor and every read refer to it.
const field = relation("field")

const styles = {
  root: css({ display: "grid", gap: "0.5rem", justifyItems: "start" }),
  label: css({
    fontSize: "0.875rem",
    fontWeight: 500,
    opacity: { base: 1, [field.within('[data-disabled="true"]')]: 0.45 },
  }),
  input: css({
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "light-dark(oklch(0.87 0 0), oklch(0.35 0 0))",
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
  }),
  toggle: css({ fontSize: "0.8125rem", textDecorationLine: "underline" }),
}

export default function RelationField() {
  const [disabled, setDisabled] = useState(false)
  return (
    <div data-disabled={disabled} sx={[field.anchor, styles.root]}>
      <label sx={styles.label} htmlFor="relation-email">
        Email
      </label>
      <input id="relation-email" disabled={disabled} sx={styles.input} />
      <button sx={styles.toggle} onClick={() => setDisabled(!disabled)}>
        {disabled ? "Enable" : "Disable"} the field
      </button>
    </div>
  )
}
`
  ),
  curated(
    "tokens-theme",
    "Tokens",
    "A variable token, overridden in a subtree",
    `import { css, defineTokens } from "@kirana-style/core"

// A variable token: a typed constant here, a custom property in the CSS.
const brand = defineTokens(
  "demo-brand",
  { accent: "light-dark(oklch(0.55 0.2 260), oklch(0.72 0.15 260))" },
  { variable: true }
)

const styles = {
  row: css({ display: "flex", alignItems: "center", gap: "0.75rem" }),
  // A subtree overrides the value; everything below follows.
  warm: css({
    display: "flex",
    [brand.accent]: "light-dark(oklch(0.62 0.19 45), oklch(0.75 0.15 60))",
  }),
  chip: css({
    borderRadius: "999px",
    paddingInline: "0.875rem",
    paddingBlock: "0.375rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "white",
    backgroundColor: brand.accent,
  }),
}

export default function TokensTheme() {
  return (
    <div sx={styles.row}>
      <span sx={styles.chip}>Default</span>
      <div sx={styles.warm}>
        <span sx={styles.chip}>Overridden</span>
      </div>
    </div>
  )
}
`
  ),
]

export const STARTER = EXAMPLES[0]!
