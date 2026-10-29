/**
 * The examples the footer offers: a multi-file starter, then one project per
 * thing Kirana does well (recipes, merging, relations, themes, motion). They
 * wear the brand: paper and ink, one scene hue each, EB Garamond for display
 * and Plus Jakarta Sans for text (the preview frame loads both), real content
 * only. Each reads in light and dark, since every colour is a pair.
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
// Kirana Play evaluates it and hands the engine the result.
export default defineConfig({
  layers: { before: ["reset"] },
})
`

const STARTER_TOKENS = `import { defineTokens } from "@kirana-style/core"

// Paper, ink and one hue. Variable tokens are custom properties in the CSS;
// a { light, dark } leaf is one light-dark() value, so switching the scheme
// needs nothing else.
export const color = defineTokens(
  "color",
  {
    card: { light: "oklch(0.997 0.002 85)", dark: "oklch(0.2 0.009 70)" },
    quiet: { light: "oklch(0.962 0.007 85)", dark: "oklch(0.25 0.01 70)" },
    ink: { light: "oklch(0.2 0.012 70)", dark: "oklch(0.965 0.006 85)" },
    paper: { light: "oklch(0.988 0.004 85)", dark: "oklch(0.165 0.008 70)" },
    muted: { light: "oklch(0.5 0.014 70)", dark: "oklch(0.72 0.012 80)" },
    line: { light: "oklch(0.912 0.01 80)", dark: "oklch(0.97 0.01 85 / 10%)" },
    // Crater: the pale sulphur water of a crater lake.
    hue: { light: "oklch(0.5 0.09 185)", dark: "oklch(0.82 0.1 185)" },
  },
  { variable: true }
)

// Inline tokens: their values are written into each rule.
export const font = defineTokens("font", {
  display: '"EB Garamond Variable", Georgia, serif',
  mono: '"JetBrains Mono Variable", ui-monospace, monospace',
})

export const space = defineTokens("space", {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  xxl: "2.5rem",
})
`

const STARTER_BUTTON = `import { recipe } from "@kirana-style/core"

import { color, space } from "./tokens"

// A recipe: the variants a caller picks by name. A call with static options
// compiles to a constant class string; no recipe table ships.
export const button = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    height: "2.5rem",
    // A finger needs 44px; a mouse does not.
    minHeight: { "@media (pointer: coarse)": "2.75rem" },
    paddingInline: space.lg,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "0.875rem",
    fontWeight: 600,
    textDecorationLine: "none",
    transitionProperty: "background-color, border-color",
    transitionDuration: "150ms",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: color.hue,
  },
  variants: {
    tone: {
      // Ink on paper, paper on night: the tokens swap with the scheme.
      solid: {
        borderColor: "transparent",
        backgroundColor: { base: color.ink, ":hover": color.muted },
        color: color.paper,
      },
      quiet: {
        borderColor: { base: color.line, ":hover": color.muted },
        backgroundColor: { base: "transparent", ":hover": color.quiet },
        color: color.ink,
      },
    },
  },
  defaultVariants: { tone: "solid" },
})
`

const STARTER_CARD = `import type { ReactNode } from "react"
import { css } from "@kirana-style/core"

import { color, font, space } from "./tokens"

// The frame around the page, opened with a numbered label and a hairline.
export function Card({ number, label, children }: { number: string; label: string; children: ReactNode }) {
  return (
    <article sx={styles.card}>
      <header sx={styles.chapter}>
        <span sx={styles.number}>{number}</span>
        <span sx={styles.label}>{label}</span>
        <span aria-hidden="true" sx={styles.rule} />
      </header>
      {children}
    </article>
  )
}

const styles = {
  card: css({
    display: "grid",
    gap: space.xl,
    width: "min(100%, 38rem)",
    padding: { base: space.xl, "@media (min-width: 40rem)": space.xxl },
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.line,
    backgroundColor: color.card,
    color: color.ink,
  }),
  chapter: css({ display: "flex", alignItems: "center", gap: space.sm }),
  number: css({ fontFamily: font.mono, fontSize: "0.6875rem", fontWeight: 600, color: color.hue }),
  label: css({
    fontFamily: font.mono,
    fontSize: "0.6875rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: color.muted,
  }),
  rule: css({ flexGrow: 1, height: "1px", backgroundColor: color.line }),
}
`

const STARTER_APP = `import { css } from "@kirana-style/core"

import { button } from "./button"
import { Card } from "./card"
import { color, font, space } from "./tokens"

// What this project is made of: each file, and what it holds.
const files = [
  { name: "app.tsx", holds: "This page: the headline, this list and the two links." },
  { name: "card.tsx", holds: "The frame around it, with its own styles." },
  { name: "button.tsx", holds: "A recipe with two tones, compiled to two class strings." },
  { name: "tokens.ts", holds: "Paper, ink and one hue, as typed constants." },
]

export default function App() {
  return (
    <Card number="01" label="Four files">
      <div sx={styles.intro}>
        <h1 sx={styles.title}>
          Write a style, read its <em sx={styles.accent}>CSS</em>.
        </h1>
        <p sx={styles.lede}>
          Change any value in these files and the preview follows. The CSS tab shows every rule
          Kirana writes for them, layer by layer.
        </p>
      </div>
      <dl sx={styles.files}>
        {files.map((file) => (
          <div key={file.name} sx={styles.file}>
            <dt sx={styles.name}>{file.name}</dt>
            <dd sx={styles.holds}>{file.holds}</dd>
          </div>
        ))}
      </dl>
      <div sx={styles.actions}>
        <a href="https://kirana.style/docs" target="_blank" rel="noreferrer" sx={button()}>
          Read the docs
        </a>
        <a href="https://github.com/kirana-style/kirana" target="_blank" rel="noreferrer" sx={button({ tone: "quiet" })}>
          Source on GitHub
        </a>
      </div>
    </Card>
  )
}

const styles = {
  intro: css({ display: "grid", gap: space.md }),
  title: css({
    margin: 0,
    fontFamily: font.display,
    fontSize: { base: "2.125rem", "@media (min-width: 40rem)": "2.75rem" },
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    textWrap: "balance",
  }),
  accent: css({ fontStyle: "italic", color: color.hue }),
  lede: css({ margin: 0, maxWidth: "32rem", fontSize: "1rem", lineHeight: 1.6, color: color.muted, textWrap: "pretty" }),
  files: css({ display: "grid", margin: 0 }),
  file: css({
    display: "grid",
    gridTemplateColumns: { base: "1fr", "@media (min-width: 30rem)": "7.5rem 1fr" },
    gap: { base: space.xs, "@media (min-width: 30rem)": space.lg },
    paddingBlock: space.md,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: color.line,
  }),
  name: css({ fontFamily: font.mono, fontSize: "0.8125rem", color: color.hue }),
  holds: css({ margin: 0, fontSize: "0.875rem", lineHeight: 1.55 }),
  actions: css({ display: "flex", flexWrap: "wrap", gap: space.md }),
}
`

const BUTTONS = `import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { css, recipe } from "@kirana-style/core"

const ink = "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))"
const paper = "light-dark(oklch(0.988 0.004 85), oklch(0.165 0.008 70))"
const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const line = "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))"
const quiet = "light-dark(oklch(0.962 0.007 85), oklch(0.25 0.01 70))"
// Terracotta, clay roof tiles: kept for the one action that cannot be undone.
const clay = "light-dark(oklch(0.53 0.15 42), oklch(0.78 0.12 45))"

// One recipe, three groups of options. Every call below has static options,
// so each compiles to a constant class string.
const button = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    // A finger needs 44px; a mouse does not.
    minHeight: { "@media (pointer: coarse)": "2.75rem" },
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: "inherit",
    fontWeight: 600,
    lineHeight: 1,
    cursor: { base: "pointer", ":disabled": "default" },
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "150ms",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: ink,
  },
  variants: {
    tone: {
      solid: {
        backgroundColor: { base: ink, ":hover:not(:disabled)": muted },
        color: paper,
      },
      quiet: {
        backgroundColor: { base: quiet, ":hover:not(:disabled)": line },
        color: ink,
      },
      outline: {
        borderColor: { base: line, ":hover:not(:disabled)": muted },
        backgroundColor: "transparent",
        color: ink,
      },
      danger: {
        borderColor: clay,
        backgroundColor: { base: "transparent", ":hover:not(:disabled)": clay },
        color: { base: clay, ":hover:not(:disabled)": paper },
      },
    },
    size: {
      sm: { height: "2rem", paddingInline: "0.75rem", fontSize: "0.8125rem" },
      md: { height: "2.5rem", paddingInline: "1rem", fontSize: "0.875rem" },
      lg: { height: "3rem", paddingInline: "1.375rem", fontSize: "0.9375rem" },
    },
    busy: {
      true: { cursor: "progress", opacity: 0.7 },
    },
  },
  defaultVariants: { tone: "solid", size: "md" },
})

export default function Toolbar() {
  const [state, setState] = useState<"draft" | "publishing" | "published">("draft")
  useEffect(() => {
    if (state !== "publishing") return
    const timer = setTimeout(() => setState("published"), 1200)
    return () => clearTimeout(timer)
  }, [state])

  return (
    <section sx={styles.panel}>
      <Group number="01" label="Tone">
        <button sx={button()}>Publish</button>
        <button sx={button({ tone: "quiet" })}>Save draft</button>
        <button sx={button({ tone: "outline" })}>Preview</button>
        <button sx={button({ tone: "danger" })}>Delete post</button>
      </Group>
      <Group number="02" label="Size">
        <button sx={button({ size: "sm" })}>Publish</button>
        <button sx={button()}>Publish</button>
        <button sx={button({ size: "lg" })}>Publish</button>
      </Group>
      <Group number="03" label="Busy">
        <button
          disabled={state === "publishing"}
          onClick={() => setState(state === "published" ? "draft" : "publishing")}
          sx={state === "publishing" ? button({ busy: true }) : button()}
        >
          {state === "draft" ? "Publish" : state === "publishing" ? "Publishing…" : "Unpublish"}
        </button>
        <span role="status" sx={styles.status}>
          {state === "published" ? "Published. Press again to take it down." : "Press Publish to see the busy variant."}
        </span>
      </Group>
    </section>
  )
}

function Group({ number, label, children }: { number: string; label: string; children: ReactNode }) {
  return (
    <div sx={styles.group}>
      <div sx={styles.chapter}>
        <span sx={styles.number}>{number}</span>
        <span sx={styles.label}>{label}</span>
        <span aria-hidden="true" sx={styles.rule} />
      </div>
      <div sx={styles.row}>{children}</div>
    </div>
  )
}

const mono = '"JetBrains Mono Variable", ui-monospace, monospace'

const styles = {
  panel: css({
    display: "grid",
    gap: "1.75rem",
    width: "min(100%, 36rem)",
    padding: { base: "1.5rem", "@media (min-width: 40rem)": "2rem" },
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: line,
    backgroundColor: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    color: ink,
  }),
  group: css({ display: "grid", gap: "0.875rem" }),
  chapter: css({ display: "flex", alignItems: "center", gap: "0.5rem" }),
  number: css({ fontFamily: mono, fontSize: "0.6875rem", fontWeight: 600, color: clay }),
  label: css({ fontFamily: mono, fontSize: "0.6875rem", letterSpacing: "0.04em", textTransform: "uppercase", color: muted }),
  rule: css({ flexGrow: 1, height: "1px", backgroundColor: line }),
  row: css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }),
  status: css({ fontSize: "0.8125rem", color: muted }),
}
`

const BUNDLERS = `import { useState } from "react"
import { css } from "@kirana-style/core"

// Kirana's bundler packages, as its docs list them.
const bundlers = [
  { name: "Vite 8", package: "@kirana-style/vite", note: "With hot updates" },
  { name: "Rolldown", package: "@kirana-style/rolldown", note: "Builds" },
  { name: "webpack 5", package: "@kirana-style/webpack", note: "With dev-server updates" },
  { name: "Rspack, Rsbuild", package: "@kirana-style/rspack", note: "With dev-server updates" },
  { name: "Bun", package: "@kirana-style/bun", note: "Builds and dev server" },
  { name: "esbuild", package: "@kirana-style/esbuild", note: "Builds" },
]

export default function Bundlers() {
  const [chosen, setChosen] = useState(bundlers[0]!)
  return (
    <section sx={styles.page}>
      <h2 sx={styles.title}>
        Pick your <em sx={styles.accent}>bundler</em>
      </h2>
      <div role="radiogroup" aria-label="Bundler" sx={styles.grid}>
        {bundlers.map((bundler) => {
          const selected = bundler === chosen
          return (
            // The chosen card is the same handle and one more: the later
            // handle wins entry by entry.
            <button
              key={bundler.package}
              role="radio"
              aria-checked={selected}
              onClick={() => setChosen(bundler)}
              sx={[styles.option, selected && styles.selected]}
            >
              <span sx={styles.name}>{bundler.name}</span>
              <span sx={styles.package}>{bundler.package}</span>
              <span sx={styles.note}>{bundler.note}</span>
            </button>
          )
        })}
      </div>
      <figure sx={styles.install}>
        <figcaption sx={styles.caption}>Install</figcaption>
        <code sx={styles.command}>npm install @kirana-style/core</code>
        <code sx={styles.command}>npm install -D {chosen.package}</code>
      </figure>
    </section>
  )
}

const ink = "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))"
const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const line = "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))"
const card = "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))"
// Lake: a lake under a clear sky.
const lake = "light-dark(oklch(0.5 0.12 245), oklch(0.78 0.1 245))"
const mono = '"JetBrains Mono Variable", ui-monospace, monospace'

const styles = {
  page: css({ display: "grid", gap: "1.5rem", width: "min(100%, 46rem)", color: ink }),
  title: css({
    margin: 0,
    fontFamily: '"EB Garamond Variable", Georgia, serif',
    fontSize: "2.25rem",
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
  }),
  accent: css({ fontStyle: "italic", color: lake }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
    gap: "0.75rem",
  }),
  option: css({
    display: "grid",
    gap: "0.25rem",
    justifyItems: "start",
    padding: "1rem 1.125rem",
    borderRadius: "0.75rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: line, ":hover": muted },
    backgroundColor: card,
    color: "inherit",
    fontFamily: "inherit",
    textAlign: "start",
    cursor: "pointer",
    translate: { base: "0 0", ":hover": "0 -2px" },
    transitionProperty: "border-color, translate",
    transitionDuration: "150ms",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: lake,
  }),
  selected: css({
    borderColor: { base: lake, ":hover": lake },
    boxShadow: "inset 0 0 0 1px " + lake,
  }),
  name: css({ fontSize: "0.9375rem", fontWeight: 600 }),
  package: css({ fontFamily: mono, fontSize: "0.75rem", color: lake }),
  note: css({ fontSize: "0.8125rem", color: muted }),
  install: css({
    display: "grid",
    gap: "0.375rem",
    margin: 0,
    padding: "1rem 1.25rem",
    borderRadius: "0.75rem",
    backgroundColor: "light-dark(oklch(0.962 0.007 85), oklch(0.25 0.01 70))",
  }),
  caption: css({ fontFamily: mono, fontSize: "0.6875rem", letterSpacing: "0.04em", textTransform: "uppercase", color: muted }),
  command: css({ fontFamily: mono, fontSize: "0.8125rem" }),
}
`

const RELATION = `import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { css, relation } from "@kirana-style/core"

// A relation names the element whose state is read (the anchor). The parts
// inside it read that state wherever they sit, with no class juggling: each
// field's label, hint and mark follow its focus and validity, and the form's
// fields follow the form.
const field = relation("field")
const form = relation("form")

const looksLikeEmail = (value: string) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value)

export default function SignIn() {
  const [email, setEmail] = useState("ada@")
  const [password, setPassword] = useState("")
  const [shown, setShown] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [tried, setTried] = useState(false)
  const [signedIn, setSignedIn] = useState<string>()

  const emailState = email.length === 0 ? undefined : looksLikeEmail(email) ? "valid" : "invalid"
  const passwordState = tried && password.length === 0 ? "invalid" : undefined

  function submit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (emailState === "valid" && password.length > 0) setSignedIn(email)
  }

  return (
    <div sx={styles.card}>
      <aside sx={styles.aside}>
        <div sx={styles.chapter}>
          <span sx={styles.number}>01</span>
          <span sx={styles.label}>Sign in</span>
          <span aria-hidden="true" sx={styles.rule} />
        </div>
        <h2 sx={styles.title}>
          Welcome <em sx={styles.accent}>back</em>.
        </h2>
        <p sx={styles.note}>
          Every label, hint and mark here reads its field's state through a relation: focused,
          valid or wrong.
        </p>
      </aside>

      {signedIn ? (
        <section sx={styles.done}>
          <h3 sx={styles.doneTitle}>You're in.</h3>
          <p role="status" sx={styles.doneText}>
            Signed in as {signedIn}. Nothing left this page: the form only checks itself.
          </p>
          <button type="button" sx={styles.submit} onClick={() => { setSignedIn(undefined); setTried(false) }}>
            Sign out
          </button>
        </section>
      ) : (
        <form noValidate data-disabled={disabled} sx={[form.anchor, styles.form]} onSubmit={submit}>
          <Field
            id="email"
            label="Email"
            state={emailState}
            hint={emailState === "invalid" ? "An email has a name, an @ and a domain." : "The address you signed up with."}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={disabled}
              aria-invalid={emailState === "invalid"}
              aria-describedby="email-hint"
              onChange={(event) => setEmail(event.target.value)}
              sx={styles.input}
            />
          </Field>
          <Field
            id="password"
            label="Password"
            state={passwordState}
            hint={passwordState === "invalid" ? "Type any password to continue." : "Anything works here."}
            action={
              <button type="button" disabled={disabled} aria-pressed={shown} onClick={() => setShown(!shown)} sx={styles.show}>
                {shown ? "Hide" : "Show"}
              </button>
            }
          >
            <input
              id="password"
              type={shown ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              disabled={disabled}
              aria-invalid={passwordState === "invalid"}
              aria-describedby="password-hint"
              onChange={(event) => setPassword(event.target.value)}
              sx={styles.input}
            />
          </Field>
          <div sx={styles.footer}>
            <button type="submit" disabled={disabled} sx={styles.submit}>Sign in</button>
            <label sx={styles.check}>
              <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} sx={styles.box} />
              Disable the form
            </label>
          </div>
        </form>
      )}
    </div>
  )
}

function Field(props: { id: string; label: string; state?: "valid" | "invalid"; hint: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div data-state={props.state} sx={[field.anchor, styles.field]}>
      <div sx={styles.top}>
        <label htmlFor={props.id} sx={styles.name}>{props.label}</label>
        {props.action}
      </div>
      <div sx={styles.control}>
        {props.children}
        <svg viewBox="0 0 16 16" aria-hidden="true" sx={styles.mark}>
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span id={props.id + "-hint"} sx={styles.hint}>{props.hint}</span>
    </div>
  )
}

const ink = "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))"
const paper = "light-dark(oklch(0.988 0.004 85), oklch(0.165 0.008 70))"
const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const line = "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))"
const quiet = "light-dark(oklch(0.962 0.007 85), oklch(0.25 0.01 70))"
// Lake, a lake under a clear sky, for the small things: the number, the
// italic word, focus and the mark of a right answer. Red for what is wrong.
const lake = "light-dark(oklch(0.5 0.12 245), oklch(0.78 0.1 245))"
const danger = "light-dark(oklch(0.53 0.2 25), oklch(0.72 0.16 25))"
const mono = '"JetBrains Mono Variable", ui-monospace, monospace'

const focused = field.within(":focus-within")
const valid = field.within('[data-state="valid"]')
const invalid = field.within('[data-state="invalid"]')
const off = form.within('[data-disabled="true"]')

const styles = {
  card: css({
    display: "grid",
    gridTemplateColumns: { base: "1fr", "@media (min-width: 44rem)": "minmax(0, 0.85fr) minmax(0, 1.15fr)" },
    width: "min(100%, 48rem)",
    overflow: "hidden",
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: line,
    backgroundColor: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    color: ink,
  }),
  aside: css({
    display: "grid",
    alignContent: { base: "start", "@media (min-width: 44rem)": "space-between" },
    gap: { base: "1rem", "@media (min-width: 44rem)": "2.5rem" },
    padding: { base: "1.5rem", "@media (min-width: 44rem)": "2.25rem" },
    backgroundColor: quiet,
  }),
  chapter: css({ display: "flex", alignItems: "center", gap: "0.5rem" }),
  number: css({ fontFamily: mono, fontSize: "0.6875rem", fontWeight: 600, color: lake }),
  label: css({ fontFamily: mono, fontSize: "0.6875rem", letterSpacing: "0.04em", textTransform: "uppercase", color: muted }),
  rule: css({ flexGrow: 1, height: "1px", backgroundColor: line }),
  title: css({
    margin: 0,
    fontFamily: '"EB Garamond Variable", Georgia, serif',
    fontSize: { base: "2.25rem", "@media (min-width: 44rem)": "2.75rem" },
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  }),
  accent: css({ fontStyle: "italic", color: lake }),
  note: css({ margin: 0, maxWidth: "18rem", fontSize: "0.875rem", lineHeight: 1.55, color: muted }),
  form: css({ display: "grid", gap: "1.75rem", padding: { base: "1.5rem", "@media (min-width: 44rem)": "2.25rem" } }),
  field: css({
    display: "grid",
    gap: "0.375rem",
    opacity: { base: 1, [off]: 0.45 },
    transitionProperty: "opacity",
    transitionDuration: "150ms",
  }),
  top: css({ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }),
  name: css({
    fontSize: "0.8125rem",
    fontWeight: 600,
    // Nested, a wrong field stays red while it is focused.
    color: { base: muted, [focused]: { base: lake, [invalid]: danger }, [invalid]: danger },
    transitionProperty: "color",
    transitionDuration: "150ms",
  }),
  control: css({ position: "relative", display: "flex", alignItems: "center" }),
  input: css({
    flexGrow: 1,
    minWidth: 0,
    height: "2.75rem",
    paddingInline: "0 1.75rem",
    borderWidth: 0,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: { base: line, ":hover": muted, ":focus": { base: lake, [invalid]: danger }, [invalid]: danger },
    borderRadius: 0,
    // The thicker underline is the focus indicator, in place of the outline.
    outlineStyle: "none",
    boxShadow: {
      base: "none",
      ":focus": { base: "0 1px 0 0 " + lake, [invalid]: "0 1px 0 0 " + danger },
      [invalid]: "0 1px 0 0 " + danger,
    },
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "1.0625rem",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "150ms",
  }),
  mark: css({
    position: "absolute",
    insetInlineEnd: "0.125rem",
    width: "1.125rem",
    height: "1.125rem",
    color: lake,
    opacity: { base: 0, [valid]: 1 },
    scale: { base: "0.6", [valid]: "1" },
    transitionProperty: "opacity, scale",
    transitionDuration: "180ms",
  }),
  hint: css({ fontSize: "0.8125rem", lineHeight: 1.45, color: { base: muted, [invalid]: danger } }),
  show: css({
    minHeight: { "@media (pointer: coarse)": "2.75rem" },
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: lake,
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecorationLine: { base: "none", ":hover": "underline" },
    textUnderlineOffset: "0.2em",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: lake,
  }),
  footer: css({ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBlockStart: "0.25rem" }),
  submit: css({
    justifySelf: "start",
    height: "2.75rem",
    paddingInline: "1.5rem",
    borderWidth: 0,
    borderRadius: "0.5rem",
    backgroundColor: { base: ink, ":hover:not(:disabled)": muted },
    color: paper,
    fontFamily: "inherit",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: { base: "pointer", ":disabled": "default" },
    opacity: { base: 1, [off]: 0.45 },
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: lake,
  }),
  check: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    minHeight: { "@media (pointer: coarse)": "2.75rem" },
    fontSize: "0.8125rem",
    color: muted,
    cursor: "pointer",
  }),
  box: css({ width: "1rem", height: "1rem", margin: 0, accentColor: lake, cursor: "pointer" }),
  done: css({ display: "grid", alignContent: "center", gap: "0.75rem", justifyItems: "start", padding: { base: "1.5rem", "@media (min-width: 44rem)": "2.25rem" } }),
  doneTitle: css({ margin: 0, fontFamily: '"EB Garamond Variable", Georgia, serif', fontSize: "2rem", fontWeight: 400, lineHeight: 1.1 }),
  doneText: css({ margin: "0 0 0.75rem", fontSize: "0.875rem", lineHeight: 1.55, color: muted }),
}
`

const THEMES = `import { useState } from "react"
import { css, defineTheme, defineTokens } from "@kirana-style/core"

// Variable tokens with a default (crater) ...
const scene = defineTokens(
  "scene",
  {
    hue: { light: "oklch(0.5 0.09 185)", dark: "oklch(0.82 0.1 185)" },
    wash: { light: "oklch(0.95 0.025 185)", dark: "oklch(0.28 0.04 185)" },
  },
  { variable: true }
)

// ... and themes that override them for a subtree. Everything inside reads
// the new values; the card component never changes.
const forest = defineTheme(scene, {
  hue: { light: "oklch(0.5 0.1 150)", dark: "oklch(0.8 0.11 150)" },
  wash: { light: "oklch(0.95 0.03 150)", dark: "oklch(0.28 0.045 150)" },
})
const terracotta = defineTheme(scene, {
  hue: { light: "oklch(0.53 0.15 42)", dark: "oklch(0.78 0.12 45)" },
  wash: { light: "oklch(0.95 0.035 45)", dark: "oklch(0.3 0.05 42)" },
})

// Three of the brand's scene hues, named for what they are in the pictures.
const hues = [
  { name: "Crater", from: "The pale sulphur water of a crater", theme: undefined },
  { name: "Forest", from: "Forest on the ridges", theme: forest },
  { name: "Terracotta", from: "Clay roof tiles", theme: terracotta },
]

export default function Themes() {
  const [chosen, setChosen] = useState("Crater")
  return (
    <div sx={styles.row}>
      {hues.map((hue) => (
        <div key={hue.name} sx={hue.theme}>
          <HueCard name={hue.name} from={hue.from} chosen={chosen === hue.name} onChoose={() => setChosen(hue.name)} />
        </div>
      ))}
    </div>
  )
}

function HueCard({ name, from, chosen, onChoose }: { name: string; from: string; chosen: boolean; onChoose: () => void }) {
  return (
    <article sx={[styles.card, chosen && styles.chosen]}>
      <div sx={styles.swatches} aria-hidden="true">
        <span sx={[styles.swatch, styles.hue]} />
        <span sx={[styles.swatch, styles.wash]} />
      </div>
      <h3 sx={styles.name}>{name}</h3>
      <p sx={styles.from}>{from}</p>
      <button aria-pressed={chosen} onClick={onChoose} sx={styles.button}>
        {chosen ? "This page's hue" : "Use " + name.toLowerCase()}
      </button>
    </article>
  )
}

const ink = "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))"
const paper = "light-dark(oklch(0.988 0.004 85), oklch(0.165 0.008 70))"
const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const line = "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))"

const styles = {
  row: css({ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }),
  card: css({
    display: "grid",
    gap: "0.5rem",
    width: "14rem",
    padding: "1.25rem",
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: line,
    backgroundColor: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    color: ink,
  }),
  chosen: css({ borderColor: scene.hue }),
  swatches: css({ display: "flex", gap: "0.375rem", marginBlockEnd: "0.75rem" }),
  swatch: css({ height: "3.5rem", borderRadius: "0.5rem" }),
  hue: css({ flexGrow: 2, backgroundColor: scene.hue }),
  wash: css({ flexGrow: 1, backgroundColor: scene.wash }),
  name: css({
    margin: 0,
    fontFamily: '"EB Garamond Variable", Georgia, serif',
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.1,
    color: scene.hue,
  }),
  from: css({ margin: 0, minHeight: "2.6em", fontSize: "0.875rem", lineHeight: 1.45, color: muted }),
  button: css({
    justifySelf: "start",
    height: "2.25rem",
    // A finger needs 44px; a mouse does not.
    minHeight: { "@media (pointer: coarse)": "2.75rem" },
    marginBlockStart: "0.5rem",
    paddingInline: "0.875rem",
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: line, '[aria-pressed="true"]': "transparent" },
    backgroundColor: { base: "transparent", ":hover": scene.wash, '[aria-pressed="true"]': scene.hue },
    color: { base: ink, '[aria-pressed="true"]': paper },
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: scene.hue,
  }),
}
`

const MOTION = `import { useEffect, useState } from "react"
import { css, keyframes } from "@kirana-style/core"

// keyframes() returns a name usable as animationName; frames nothing uses
// emit nothing. Each one here says something: how far the work has gone
// (fill), where the result will appear (shimmer), that it has arrived (settle).
const fill = keyframes({ from: { width: "4%" }, to: { width: "100%" } })
const shimmer = keyframes({
  from: { backgroundPosition: "200% 0" },
  to: { backgroundPosition: "-200% 0" },
})
const settle = keyframes({
  from: { opacity: 0, translate: "0 4px" },
  to: { opacity: 1, translate: "0 0" },
})

// What Kirana writes for a grid with a gap (shortened class names).
const rules = [
  "@layer kirana.atoms {",
  "  .k1 { display: grid }",
  "  .k2 { gap: 1rem }",
  "}",
]

export default function Compile() {
  const [compiling, setCompiling] = useState(true)
  useEffect(() => {
    if (!compiling) return
    const timer = setTimeout(() => setCompiling(false), 1800)
    return () => clearTimeout(timer)
  }, [compiling])

  return (
    <section sx={styles.card} aria-busy={compiling}>
      <header sx={styles.header}>
        <div sx={styles.headings}>
          <h2 sx={styles.title}>{compiling ? "Compiling app.tsx" : "Compiled app.tsx"}</h2>
          <span role="status" sx={styles.subtitle}>
            {compiling ? "Writing the stylesheet" : "Two atoms, in the atoms layer"}
          </span>
        </div>
        <button disabled={compiling} onClick={() => setCompiling(true)} sx={styles.again}>
          Compile again
        </button>
      </header>
      <div sx={styles.track}>
        {compiling && <div sx={styles.progress} />}
      </div>
      <pre sx={styles.output}>
        {rules.map((rule, index) =>
          compiling ? (
            <span key={index} sx={styles.skeleton} style={{ width: 40 + ((index * 23) % 45) + "%" }} />
          ) : (
            <code key={index} sx={styles.rule} style={{ animationDelay: index * 60 + "ms" }}>
              {rule}
            </code>
          )
        )}
      </pre>
    </section>
  )
}

const ink = "light-dark(oklch(0.2 0.012 70), oklch(0.965 0.006 85))"
const muted = "light-dark(oklch(0.5 0.014 70), oklch(0.72 0.012 80))"
const line = "light-dark(oklch(0.912 0.01 80), oklch(0.97 0.01 85 / 10%))"
const quiet = "light-dark(oklch(0.962 0.007 85), oklch(0.25 0.01 70))"
// Tea: tea rows and morning grass.
const tea = "light-dark(oklch(0.5 0.11 128), oklch(0.83 0.13 128))"
const mono = '"JetBrains Mono Variable", ui-monospace, monospace'

// Motion stops for people who ask for less of it.
const calm = "@media (prefers-reduced-motion: reduce)"

const styles = {
  card: css({
    display: "grid",
    gap: "1.25rem",
    width: "min(100%, 28rem)",
    padding: "1.75rem",
    borderRadius: "0.875rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: line,
    backgroundColor: "light-dark(oklch(0.997 0.002 85), oklch(0.2 0.009 70))",
    color: ink,
  }),
  header: css({ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem" }),
  headings: css({ display: "grid", gap: "0.25rem" }),
  title: css({ margin: 0, fontFamily: mono, fontSize: "0.9375rem", fontWeight: 600 }),
  subtitle: css({ fontSize: "0.8125rem", color: muted }),
  again: css({
    flexShrink: 0,
    height: "2rem",
    // A finger needs 44px; a mouse does not.
    minHeight: { "@media (pointer: coarse)": "2.75rem" },

    paddingInline: "0.75rem",
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: line, ":hover:not(:disabled)": muted },
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: { base: "pointer", ":disabled": "default" },
    opacity: { base: 1, ":disabled": 0.5 },
    outlineStyle: { base: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
    outlineOffset: "2px",
    outlineColor: tea,
  }),
  track: css({ height: "0.25rem", borderRadius: "999px", backgroundColor: quiet, overflow: "hidden" }),
  progress: css({
    height: "100%",
    borderRadius: "inherit",
    backgroundColor: tea,
    animationName: fill,
    animationDuration: { base: "1.8s", [calm]: "0s" },
    animationTimingFunction: "cubic-bezier(0.3, 0.6, 0.3, 1)",
    animationFillMode: "forwards",
  }),
  output: css({
    display: "grid",
    gap: "0.5rem",
    minHeight: "7rem",
    margin: 0,
    padding: "1rem 1.125rem",
    borderRadius: "0.625rem",
    backgroundColor: quiet,
    fontFamily: mono,
    fontSize: "0.8125rem",
  }),
  skeleton: css({
    display: "block",
    height: "0.875rem",
    marginBlock: "0.125rem",
    borderRadius: "0.25rem",
    backgroundImage:
      "linear-gradient(90deg, light-dark(oklch(0.92 0.008 85), oklch(0.3 0.01 70)) 0%, light-dark(oklch(0.985 0.004 85), oklch(0.36 0.012 70)) 50%, light-dark(oklch(0.92 0.008 85), oklch(0.3 0.01 70)) 100%)",
    backgroundSize: "200% 100%",
    animationName: shimmer,
    animationDuration: "1.4s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationPlayState: { base: "running", [calm]: "paused" },
  }),
  rule: css({
    whiteSpace: "pre",
    animationName: settle,
    animationDuration: { base: "240ms", [calm]: "0s" },
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
  }),
}
`

const single = (
  id: string,
  title: string,
  description: string,
  code: string
): Example => ({
  id,
  title,
  description,
  files: [{ name: "app.tsx", code }],
})

export const EXAMPLES: Example[] = [
  {
    id: "starter",
    title: "Starter",
    description:
      "A component, a recipe, tokens and a configuration in their own files",
    files: [
      { name: "app.tsx", code: STARTER_APP },
      { name: "card.tsx", code: STARTER_CARD },
      { name: "button.tsx", code: STARTER_BUTTON },
      { name: "tokens.ts", code: STARTER_TOKENS },
      { name: "kirana.config.ts", code: CONFIG },
    ],
  },
  single(
    "buttons",
    "Buttons",
    "One recipe: tones, sizes and a boolean variant, every call static",
    BUTTONS
  ),
  single(
    "bundlers",
    "Bundlers",
    "A chosen card by merging handles, hover, and a grid that fits its width",
    BUNDLERS
  ),
  single(
    "sign-in",
    "Sign-in form",
    "Relations: labels and hints read their field's focus and validity",
    RELATION
  ),
  single(
    "themes",
    "Themes",
    "Variable tokens, overridden for a subtree with defineTheme",
    THEMES
  ),
  single(
    "motion",
    "Motion",
    "Keyframes for progress, a placeholder and an arrival, calmer on request",
    MOTION
  ),
]

export const STARTER = EXAMPLES[0]!
